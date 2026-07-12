import { useEffect, useMemo, useState } from 'react';
import { EMPRESA_NOME, EMPRESA_PIX } from '../../config';
import { Badge } from '../../components/Badge';
import { authFetch } from '../../lib/auth';
import { linkWhatsapp } from '../../lib/formaPagamento';
import type { Pedido } from '../../types';

interface SaldoCliente {
  chave: string;
  nome: string;
  telefone: string | null;
  pedidos: Pedido[];
  saldoDevedor: number;
}

export function AdminFiado() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [marcandoId, setMarcandoId] = useState<number | null>(null);

  function carregarPedidos() {
    setCarregando(true);
    authFetch('/api/pedidos')
      .then((res) => res.json())
      .then((data: Pedido[]) => setPedidos(Array.isArray(data) ? data : []))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregarPedidos();
  }, []);

  function valorFiado(pedido: Pedido): number {
    return pedido.pagamentos
      .filter((pg) => pg.forma_pagamento === 'FIADO')
      .reduce((acc, pg) => acc + Number(pg.valor), 0);
  }

  const fiados = pedidos.filter((p) => p.pagamentos.some((pg) => pg.forma_pagamento === 'FIADO'));
  const pendentes = fiados.filter((p) => !p.fiado_pago);
  const pagos = fiados.filter((p) => p.fiado_pago);
  const totalPendente = pendentes.reduce((acc, p) => acc + valorFiado(p), 0);

  const clientesPendentes = useMemo(() => {
    const mapa = new Map<string, SaldoCliente>();
    for (const pedido of pendentes) {
      const chave = pedido.cliente_telefone || `nome:${pedido.cliente_nome}`;
      const grupo = mapa.get(chave) || {
        chave,
        nome: pedido.cliente_nome,
        telefone: pedido.cliente_telefone,
        pedidos: [],
        saldoDevedor: 0,
      };
      grupo.pedidos.push(pedido);
      grupo.saldoDevedor += valorFiado(pedido);
      mapa.set(chave, grupo);
    }
    return Array.from(mapa.values()).sort((a, b) => b.saldoDevedor - a.saldoDevedor);
  }, [pendentes]);

  async function marcarComoPago(id: number) {
    setMarcandoId(id);
    try {
      const res = await authFetch(`/api/pedidos/${id}/pagar`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      carregarPedidos();
    } finally {
      setMarcandoId(null);
    }
  }

  function mensagemCobranca(cliente: SaldoCliente) {
    const compras = cliente.pedidos.length === 1 ? '1 compra' : `${cliente.pedidos.length} compras`;
    return `Olá, ${cliente.nome}! Aqui é do ${EMPRESA_NOME}. Seu saldo devedor (fiado) é de R$ ${cliente.saldoDevedor.toFixed(
      2
    )}, referente a ${compras}.\n\nChave Pix para pagamento: ${EMPRESA_PIX}`;
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-white">Fiado</h2>

      {!carregando && (
        <div className="mb-6 rounded-lg border border-onix-border bg-onix-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total pendente</p>
          <p className="mt-1 text-2xl font-bold text-lobo-gold">R$ {totalPendente.toFixed(2)}</p>
        </div>
      )}

      {carregando && <p className="text-slate-400">Carregando...</p>}

      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Pendentes</h3>
      {!carregando && clientesPendentes.length === 0 && (
        <p className="mb-6 text-sm text-slate-500">Nenhum fiado em aberto.</p>
      )}
      {!carregando && clientesPendentes.length > 0 && (
        <div className="mb-8 space-y-3">
          {clientesPendentes.map((cliente) => (
            <div key={cliente.chave} className="rounded-md border border-onix-border bg-onix-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{cliente.nome}</p>
                  <p className="text-xs text-slate-400">{cliente.telefone || 'sem telefone'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Saldo devedor</p>
                    <span className="text-lg font-bold text-lobo-gold">R$ {cliente.saldoDevedor.toFixed(2)}</span>
                  </div>

                  {cliente.telefone && (
                    <a
                      href={linkWhatsapp(cliente.telefone, mensagemCobranca(cliente))}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-500"
                    >
                      Cobrar no WhatsApp
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-1 border-t border-onix-border pt-3">
                {cliente.pedidos.map((pedido) => (
                  <div key={pedido.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">
                      {new Date(pedido.criado_em).toLocaleDateString('pt-BR')} — R${' '}
                      {valorFiado(pedido).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => marcarComoPago(pedido.id)}
                      disabled={marcandoId === pedido.id}
                      className="rounded-md bg-lobo-gold px-2 py-1 text-xs font-bold text-black hover:bg-lobo-goldDark disabled:opacity-40"
                    >
                      {marcandoId === pedido.id ? '...' : 'Marcar como pago'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Pagos</h3>
      {!carregando && pagos.length === 0 && <p className="text-sm text-slate-500">Nenhum fiado quitado ainda.</p>}
      {!carregando && pagos.length > 0 && (
        <div className="space-y-2">
          {pagos.map((pedido) => (
            <div
              key={pedido.id}
              className="flex items-center justify-between rounded-md border border-onix-border bg-onix-surface px-4 py-2 opacity-70"
            >
              <span className="text-sm text-white">{pedido.cliente_nome}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-300">R$ {valorFiado(pedido).toFixed(2)}</span>
                <Badge tom="success">Pago</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
