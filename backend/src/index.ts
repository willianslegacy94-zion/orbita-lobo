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

// GET /api/pedidos - lista vendas para o painel administrativo (admin)
app.get('/api/pedidos', autenticar, exigirAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM pedidos ORDER BY criado_em DESC');
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
              pe.criado_em, pe.forma_pagamento
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

// PATCH /api/pedidos/:id/pagar - marca uma venda fiado como paga (admin)
app.patch('/api/pedidos/:id/pagar', autenticar, exigirAdmin, async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE pedidos SET fiado_pago = TRUE WHERE id = $1 AND forma_pagamento = 'FIADO' RETURNING *`,
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

interface CriarPedidoBody {
  cliente_nome?: string;
  cliente_telefone?: string;
  forma_pagamento?: FormaPagamento;
  itens: ItemPedidoInput[];
}

// POST /api/pedidos - registra uma venda do balcão (caixa e admin autenticados)
app.post('/api/pedidos', autenticar, async (req: Request<{}, {}, CriarPedidoBody>, res: Response) => {
  const { cliente_nome, cliente_telefone, forma_pagamento = 'DINHEIRO', itens } = req.body;
  const vendedor_id = req.usuario!.id;

  if (!itens || itens.length === 0) {
    res.status(400).json({ error: 'itens são obrigatórios' });
    return;
  }

  if (forma_pagamento === 'FIADO' && (!cliente_nome?.trim() || !cliente_telefone?.trim())) {
    res.status(400).json({ error: 'Nome e telefone do cliente são obrigatórios para venda fiado' });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const total = itens.reduce((acc, item) => acc + item.quantidade * item.preco_unitario, 0);

    const pedidoResult = await client.query(
      `INSERT INTO pedidos (cliente_nome, cliente_telefone, vendedor_id, forma_pagamento, total)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [cliente_nome?.trim() || 'Cliente Balcão', cliente_telefone || null, vendedor_id, forma_pagamento, total]
    );

    const pedido = pedidoResult.rows[0];

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

    res.status(201).json({ ...pedido, itens });
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
