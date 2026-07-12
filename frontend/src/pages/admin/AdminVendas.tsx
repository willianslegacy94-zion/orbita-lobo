import { useEffect, useState } from 'react';
import { Badge } from '../../components/Badge';
import { FiltroPeriodo, type RangeData } from '../../components/FiltroPeriodo';
import { StatCard } from '../../components/StatCard';
import { authFetch } from '../../lib/auth';
import { FORMA_PAGAMENTO_LABELS } from '../../lib/formaPagamento';
import type { Pedido } from '../../types';

export function AdminVendas() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState<RangeData | null>(null);

  useEffect(() => {
    authFetch('/api/pedidos')
      .then((res) => res.json())
      .then((data: Pedido[]) => setPedidos(Array.isArray(data) ? data : []))
      .finally(() => setCarregando(false));
  }, []);

  const vendasNoPeriodo = periodo
    ? pedidos.filter((p) => {
        const data = p.criado_em.slice(0, 10);
        return data >= periodo.inicio && data <= periodo.fim;
      })
    : [];

  const totalVendido = vendasNoPeriodo.reduce((acc, p) => acc + Number(p.total), 0);
  const ticketMedio = vendasNoPeriodo.length > 0 ? totalVendido / vendasNoPeriodo.length : 0;

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-white">Vendas do Dia</h2>

      <FiltroPeriodo onMudar={setPeriodo} />

      {carregando && <p className="text-slate-400">Carregando...</p>}

      {!carregando && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard titulo="Total vendido" valor={`R$ ${totalVendido.toFixed(2)}`} tom="gold" />
          <StatCard titulo="Nº de vendas" valor={String(vendasNoPeriodo.length)} />
          <StatCard titulo="Ticket médio" valor={`R$ ${ticketMedio.toFixed(2)}`} />
        </div>
      )}

      {!carregando && vendasNoPeriodo.length === 0 && (
        <p className="text-slate-400">Nenhuma venda registrada nesse período.</p>
      )}

      {!carregando && vendasNoPeriodo.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-onix-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-onix-surface text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {vendasNoPeriodo.map((venda) => (
                <tr key={venda.id} className="border-t border-onix-border">
                  <td className="px-4 py-3 text-slate-300">
                    {new Date(venda.criado_em).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-white">{venda.cliente_nome}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {venda.pagamentos.map((pagamento, indice) => (
                        <Badge key={indice} tom={pagamento.forma_pagamento === 'FIADO' ? 'warning' : 'neutral'}>
                          {FORMA_PAGAMENTO_LABELS[pagamento.forma_pagamento]}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-lobo-gold">
                    R$ {Number(venda.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-onix-border bg-onix-surface font-semibold">
                <td colSpan={3} className="px-4 py-3 text-right text-slate-300">
                  Total do período
                </td>
                <td className="px-4 py-3 text-right text-lobo-gold">R$ {totalVendido.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
