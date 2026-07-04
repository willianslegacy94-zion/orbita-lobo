import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FORMAS_PAGAMENTO, FORMA_PAGAMENTO_LABELS } from '../lib/formaPagamento';
import { authFetch, getSessao, limparSessao } from '../lib/auth';
import { CarrinhoItemRow } from '../components/CarrinhoItemRow';
import { Cupom, type ComprovanteData } from '../components/Cupom';
import { FiltroCategorias } from '../components/FiltroCategorias';
import { ModalMetragem } from '../components/ModalMetragem';
import { ProdutoCard } from '../components/ProdutoCard';
import { Toast } from '../components/Toast';
import type { FormaPagamento, ItemCarrinho, Produto, StatusEnvio } from '../types';

export function PDV() {
  const navigate = useNavigate();
  const sessao = getSessao();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('DINHEIRO');

  const [statusEnvio, setStatusEnvio] = useState<StatusEnvio>('idle');
  const [mensagemEnvio, setMensagemEnvio] = useState<string | null>(null);
  const [comprovante, setComprovante] = useState<ComprovanteData | null>(null);
  const [produtoParaMetragem, setProdutoParaMetragem] = useState<Produto | null>(null);

  useEffect(() => {
    authFetch('/api/produtos')
      .then((res) => res.json())
      .then((data: Produto[]) => setProdutos(Array.isArray(data) ? data : []))
      .catch(() => setErro('Não foi possível carregar os produtos.'))
      .finally(() => setCarregando(false));
  }, []);

  const categorias = useMemo(
    () => ['Todos', ...Array.from(new Set(produtos.map((p) => p.categoria)))],
    [produtos]
  );

  const produtosFiltrados = produtos.filter((p) => {
    const combinaCategoria = categoriaAtiva === 'Todos' || p.categoria === categoriaAtiva;
    const combinaBusca =
      p.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      p.sku.toLowerCase().includes(busca.toLowerCase());
    return combinaCategoria && combinaBusca;
  });

  function adicionarQuantidade(produto: Produto, quantidade: number) {
    setCarrinho((atual) => {
      const existente = atual.find((item) => item.produto.id === produto.id);
      if (existente) {
        return atual.map((item) =>
          item.produto.id === produto.id ? { ...item, quantidade: item.quantidade + quantidade } : item
        );
      }
      return [...atual, { produto, quantidade }];
    });
  }

  function selecionarProduto(produto: Produto) {
    if (produto.unidade_medida === 'MT') {
      setProdutoParaMetragem(produto);
      return;
    }
    adicionarQuantidade(produto, 1);
  }

  function confirmarMetragem(quantidade: number) {
    if (!produtoParaMetragem) return;
    adicionarQuantidade(produtoParaMetragem, quantidade);
    setProdutoParaMetragem(null);
  }

  function alterarQuantidade(produtoId: number, quantidade: number) {
    if (quantidade <= 0) {
      removerDoCarrinho(produtoId);
      return;
    }
    setCarrinho((atual) =>
      atual.map((item) => (item.produto.id === produtoId ? { ...item, quantidade } : item))
    );
  }

  function removerDoCarrinho(produtoId: number) {
    setCarrinho((atual) => atual.filter((item) => item.produto.id !== produtoId));
  }

  const total = carrinho.reduce((acc, item) => acc + item.quantidade * Number(item.produto.preco_venda), 0);

  async function finalizarPedido() {
    if (carrinho.length === 0) return;

    if (formaPagamento === 'FIADO' && (!clienteNome.trim() || !clienteTelefone.trim())) {
      setStatusEnvio('erro');
      setMensagemEnvio('Fiado exige nome e telefone do cliente.');
      return;
    }

    setStatusEnvio('enviando');
    setMensagemEnvio(null);

    const payload = {
      cliente_nome: clienteNome.trim() || undefined,
      cliente_telefone: formaPagamento === 'FIADO' ? clienteTelefone.trim() : undefined,
      forma_pagamento: formaPagamento,
      itens: carrinho.map((item) => ({
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        preco_unitario: Number(item.produto.preco_venda),
      })),
    };

    try {
      const res = await authFetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Não foi possível salvar. Tente novamente.');
      }

      const pedidoCriado = await res.json();

      setStatusEnvio('sucesso');
      setMensagemEnvio('Venda registrada com sucesso.');
      setComprovante({
        pedidoId: pedidoCriado.id,
        criadoEm: pedidoCriado.criado_em,
        clienteNome: clienteNome.trim() || 'Cliente Balcão',
        formaPagamento,
        itens: carrinho,
        total,
      });
      setCarrinho([]);
      setClienteNome('');
      setClienteTelefone('');
      setFormaPagamento('DINHEIRO');
    } catch (err) {
      setStatusEnvio('erro');
      setMensagemEnvio(err instanceof Error ? err.message : 'Não foi possível salvar. Tente novamente.');
    }
  }

  return (
    <div className="min-h-screen bg-onix font-sans text-white">
      <header className="border-b border-onix-border bg-gradient-to-b from-lobo-red/40 to-onix px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-lobo-gold">DEPÓSITO LOBO</h1>
            <p className="text-sm font-medium text-slate-300">Materiais para Construção — Frente de Caixa</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-xs text-slate-400">
              <p>Operador</p>
              <p className="font-semibold text-white">{sessao?.usuario.nome}</p>
            </div>
            {sessao?.usuario.perfil === 'ADMIN' && (
              <Link
                to="/admin"
                className="rounded-md border border-onix-border px-3 py-2 text-sm font-medium text-slate-300 hover:bg-onix-surfaceHover"
              >
                Painel Administrativo →
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                limparSessao();
                navigate('/login', { replace: true });
              }}
              className="rounded-md border border-onix-border px-3 py-2 text-sm font-medium text-slate-300 hover:bg-onix-surfaceHover"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
        <section className="rounded-lg border border-onix-border bg-onix-surface p-4 md:col-span-2">
          <input
            type="text"
            placeholder="Buscar produto por nome ou SKU..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="mb-4 w-full rounded-md border border-onix-border bg-black/30 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-lobo-gold"
          />

          <FiltroCategorias categorias={categorias} categoriaAtiva={categoriaAtiva} onSelecionar={setCategoriaAtiva} />

          {carregando && <p className="text-slate-400">Carregando produtos...</p>}
          {erro && <p className="text-red-400">{erro}</p>}
          {!carregando && !erro && produtosFiltrados.length === 0 && (
            <p className="text-slate-400">Nenhum produto encontrado para esse filtro.</p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {produtosFiltrados.map((produto) => (
              <ProdutoCard key={produto.id} produto={produto} onAdicionar={selecionarProduto} />
            ))}
          </div>
        </section>

        <aside className="flex flex-col rounded-lg border border-onix-border bg-onix-surface p-4">
          <h2 className="mb-3 text-lg font-bold text-lobo-gold">Venda Atual</h2>

          {formaPagamento !== 'FIADO' && (
            <input
              type="text"
              placeholder="Cliente (opcional)"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              className="mb-3 w-full rounded-md border border-onix-border bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-lobo-gold"
            />
          )}

          <div className="flex-1 space-y-2 overflow-y-auto">
            {carrinho.length === 0 && (
              <p className="text-sm text-slate-500">Nenhum item no carrinho. Busque um produto para começar.</p>
            )}
            {carrinho.map((item) => (
              <CarrinhoItemRow
                key={item.produto.id}
                item={item}
                onAlterarQuantidade={alterarQuantidade}
                onRemover={removerDoCarrinho}
              />
            ))}
          </div>

          <div className="mt-4 space-y-3 border-t border-onix-border pt-4">
            <label className="block text-xs font-semibold text-slate-400">
              Forma de pagamento
              <div className="mt-1 grid grid-cols-3 gap-1.5">
                {FORMAS_PAGAMENTO.map((forma) => (
                  <button
                    key={forma}
                    type="button"
                    onClick={() => setFormaPagamento(forma)}
                    className={`rounded-md py-1.5 text-xs font-semibold transition ${
                      formaPagamento === forma ? 'bg-lobo-gold text-black' : 'bg-black/30 text-slate-300'
                    }`}
                  >
                    {FORMA_PAGAMENTO_LABELS[forma]}
                  </button>
                ))}
              </div>
            </label>

            {formaPagamento === 'FIADO' && (
              <div className="space-y-2 rounded-md border border-lobo-gold/30 bg-black/20 p-3">
                <p className="text-xs font-semibold text-lobo-gold">Fiado — nome e telefone são obrigatórios</p>
                <label className="block text-xs font-semibold text-slate-400">
                  Nome do cliente
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    className="mt-1 w-full rounded-md border border-onix-border bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-400">
                  Telefone do cliente
                  <input
                    type="tel"
                    placeholder="(11) 90000-0000"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                    className="mt-1 w-full rounded-md border border-onix-border bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
                  />
                </label>
              </div>
            )}

            {mensagemEnvio && (
              <Toast tipo={statusEnvio === 'sucesso' ? 'sucesso' : 'erro'} mensagem={mensagemEnvio} />
            )}

            <div className="flex justify-between text-lg font-bold text-lobo-gold">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>

            <button
              onClick={finalizarPedido}
              disabled={carrinho.length === 0 || statusEnvio === 'enviando'}
              className="w-full rounded-md bg-lobo-gold py-2 font-bold text-black transition hover:bg-lobo-goldDark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {statusEnvio === 'enviando' ? 'Salvando...' : 'Finalizar Venda'}
            </button>
          </div>
        </aside>
      </main>

      {comprovante && <Cupom dados={comprovante} onFechar={() => setComprovante(null)} />}
      {produtoParaMetragem && (
        <ModalMetragem
          produto={produtoParaMetragem}
          onConfirmar={confirmarMetragem}
          onFechar={() => setProdutoParaMetragem(null)}
        />
      )}
    </div>
  );
}
