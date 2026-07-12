import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { autenticar, exigirAdmin, gerarToken } from './auth';
import { pool } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

interface LoginBody {
  email: string;
  senha: string;
}

// POST /api/auth/login - autentica caixa ou admin e retorna um token JWT
app.post('/api/auth/login', async (req: Request<{}, {}, LoginBody>, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    res.status(400).json({ error: 'email e senha são obrigatórios' });
    return;
  }

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario = result.rows[0];

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      res.status(401).json({ error: 'Email ou senha inválidos' });
      return;
    }

    const dadosToken = { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil };
    res.json({ token: gerarToken(dadosToken), usuario: dadosToken });
  } catch (error) {
    console.error('Erro ao autenticar:', error);
    res.status(500).json({ error: 'Erro ao autenticar' });
  }
});

// GET /api/produtos - lista produtos do estoque (caixa e admin)
app.get('/api/produtos', autenticar, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM produtos ORDER BY descricao ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

interface ProdutoBody {
  sku: string;
  descricao: string;
  categoria: string;
  unidade_medida: 'UN' | 'M3' | 'KG' | 'MT';
  peso_unitario_kg?: number;
  qtd_atual?: number;
  estoque_minimo?: number;
  preco_custo?: number;
  preco_venda?: number;
}

// POST /api/produtos - cadastra um novo produto no estoque (admin)
app.post('/api/produtos', autenticar, exigirAdmin, async (req: Request<{}, {}, ProdutoBody>, res: Response) => {
  const {
    sku,
    descricao,
    categoria,
    unidade_medida,
    peso_unitario_kg = 0,
    qtd_atual = 0,
    estoque_minimo = 0,
    preco_custo = 0,
    preco_venda = 0,
  } = req.body;

  if (!sku?.trim() || !descricao?.trim() || !categoria?.trim() || !unidade_medida) {
    res.status(400).json({ error: 'sku, descricao, categoria e unidade_medida são obrigatórios' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO produtos (sku, descricao, categoria, unidade_medida, peso_unitario_kg, qtd_atual, estoque_minimo, preco_custo, preco_venda)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [sku.trim(), descricao.trim(), categoria.trim(), unidade_medida, peso_unitario_kg, qtd_atual, estoque_minimo, preco_custo, preco_venda]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Já existe um produto com esse SKU' });
      return;
    }
    console.error('Erro ao cadastrar produto:', error);
    res.status(500).json({ error: 'Erro ao cadastrar produto' });
  }
});

// PUT /api/produtos/:id - edita um produto existente, incluindo ajuste de estoque (admin)
app.put('/api/produtos/:id', autenticar, exigirAdmin, async (req: Request<{ id: string }, {}, ProdutoBody>, res: Response) => {
  const { id } = req.params;
  const {
    sku,
    descricao,
    categoria,
    unidade_medida,
    peso_unitario_kg = 0,
    qtd_atual = 0,
    estoque_minimo = 0,
    preco_custo = 0,
    preco_venda = 0,
  } = req.body;

  if (!sku?.trim() || !descricao?.trim() || !categoria?.trim() || !unidade_medida) {
    res.status(400).json({ error: 'sku, descricao, categoria e unidade_medida são obrigatórios' });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE produtos
       SET sku = $1, descricao = $2, categoria = $3, unidade_medida = $4, peso_unitario_kg = $5,
           qtd_atual = $6, estoque_minimo = $7, preco_custo = $8, preco_venda = $9, atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [sku.trim(), descricao.trim(), categoria.trim(), unidade_medida, peso_unitario_kg, qtd_atual, estoque_minimo, preco_custo, preco_venda, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Já existe um produto com esse SKU' });
      return;
    }
    console.error('Erro ao editar produto:', error);
    res.status(500).json({ error: 'Erro ao editar produto' });
  }
});

// GET /api/pedidos - lista vendas para o painel administrativo (admin)
app.get('/api/pedidos', autenticar, exigirAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT pe.*,
              COALESCE(
                (SELECT json_agg(json_build_object('forma_pagamento', pp.forma_pagamento, 'valor', pp.valor) ORDER BY pp.id)
                 FROM pagamentos_pedido pp WHERE pp.pedido_id = pe.id),
                '[]'
              ) AS pagamentos
       FROM pedidos pe
       ORDER BY pe.criado_em DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
});

// GET /api/itens-pedido - itens vendidos com dados do produto e do pedido, para rankings (admin)
app.get('/api/itens-pedido', autenticar, exigirAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT ip.id, ip.pedido_id, ip.produto_id, ip.quantidade, ip.preco_unitario,
              p.descricao AS produto_descricao, p.unidade_medida,
              pe.criado_em
       FROM itens_pedido ip
       JOIN produtos p ON p.id = ip.produto_id
       JOIN pedidos pe ON pe.id = ip.pedido_id
       ORDER BY pe.criado_em DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar itens vendidos:', error);
    res.status(500).json({ error: 'Erro ao listar itens vendidos' });
  }
});

// PATCH /api/pedidos/:id/pagar - marca uma venda com pagamento fiado como paga (admin)
app.patch('/api/pedidos/:id/pagar', autenticar, exigirAdmin, async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE pedidos SET fiado_pago = TRUE
       WHERE id = $1 AND EXISTS (SELECT 1 FROM pagamentos_pedido pp WHERE pp.pedido_id = pedidos.id AND pp.forma_pagamento = 'FIADO')
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Venda fiado não encontrada' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao marcar fiado como pago:', error);
    res.status(500).json({ error: 'Erro ao marcar fiado como pago' });
  }
});

interface ItemPedidoInput {
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
}

type FormaPagamento = 'DINHEIRO' | 'PIX' | 'DEBITO' | 'CREDITO' | 'FIADO';

interface PagamentoInput {
  forma_pagamento: FormaPagamento;
  valor: number;
}

interface CriarPedidoBody {
  cliente_nome?: string;
  cliente_telefone?: string;
  pagamentos: PagamentoInput[];
  itens: ItemPedidoInput[];
}

const TOLERANCIA_CENTAVOS = 0.01;

// POST /api/pedidos - registra uma venda do balcão (caixa e admin autenticados)
app.post('/api/pedidos', autenticar, async (req: Request<{}, {}, CriarPedidoBody>, res: Response) => {
  const { cliente_nome, cliente_telefone, pagamentos, itens } = req.body;
  const vendedor_id = req.usuario!.id;

  if (!itens || itens.length === 0) {
    res.status(400).json({ error: 'itens são obrigatórios' });
    return;
  }

  if (!pagamentos || pagamentos.length === 0) {
    res.status(400).json({ error: 'pagamentos são obrigatórios' });
    return;
  }

  if (pagamentos.some((p) => !p.forma_pagamento || !(p.valor > 0))) {
    res.status(400).json({ error: 'Cada pagamento precisa de forma_pagamento e valor maior que zero' });
    return;
  }

  const total = itens.reduce((acc, item) => acc + item.quantidade * item.preco_unitario, 0);
  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);

  if (Math.abs(totalPago - total) > TOLERANCIA_CENTAVOS) {
    res.status(400).json({ error: 'A soma dos pagamentos precisa ser igual ao total da venda' });
    return;
  }

  const temFiado = pagamentos.some((p) => p.forma_pagamento === 'FIADO');

  if (temFiado && (!cliente_nome?.trim() || !cliente_telefone?.trim())) {
    res.status(400).json({ error: 'Nome e telefone do cliente são obrigatórios para venda com fiado' });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const pedidoResult = await client.query(
      `INSERT INTO pedidos (cliente_nome, cliente_telefone, vendedor_id, total)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [cliente_nome?.trim() || 'Cliente Balcão', cliente_telefone || null, vendedor_id, total]
    );

    const pedido = pedidoResult.rows[0];

    for (const pagamento of pagamentos) {
      await client.query(
        `INSERT INTO pagamentos_pedido (pedido_id, forma_pagamento, valor)
         VALUES ($1, $2, $3)`,
        [pedido.id, pagamento.forma_pagamento, pagamento.valor]
      );
    }

    for (const item of itens) {
      await client.query(
        `INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
         VALUES ($1, $2, $3, $4)`,
        [pedido.id, item.produto_id, item.quantidade, item.preco_unitario]
      );

      await client.query(
        `UPDATE produtos SET qtd_atual = qtd_atual - $1, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2`,
        [item.quantidade, item.produto_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({ ...pedido, pagamentos, itens });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar venda:', error);
    res.status(500).json({ error: 'Erro ao registrar venda' });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`Orbita Lobo API rodando na porta ${PORT}`);
});
