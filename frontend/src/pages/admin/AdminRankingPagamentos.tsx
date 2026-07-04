import { useEffect, useMemo, useState } from 'react';
import { FiltroPeriodo, type RangeData } from '../../components/FiltroPeriodo';
import { authFetch } from '../../lib/auth';
import { FORMA_PAGAMENTO_LABELS } from '../../lib/formaPagamento';
import type { FormaPagamento, Pedido } from '../../types';

interface LinhaRanking {
  forma: FormaPagamento;
  quantidade: number;
  valorTotal: number;
}

export function AdminRankingPagamentos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState<RangeData | null>(null);

  useEffect(() => {
    authFetch('/api/pedidos')
      .then((res) => res.json())
      .then((data: Pedido[]) => setPedidos(Array.isArray(data) ? data : []))
      .finally(() => setCarregando(false));
  }, []);

  const { ranking, totalGeral } = useMemo(() => {
    if (!periodo) return { ranking: [] as LinhaRanking[], totalGeral: 0 };

    const pedidosNoPeriodo = pedidos.filter((p) => {
      const data = p.criado_em.slice(0, 10);
      return data >= periodo.inicio && data <= periodo.fim;
    });

    const mapa = new Map<FormaPagamento, LinhaRanking>();
    for (const pedido of pedidosNoPeriodo) {
      const atual = mapa.get(pedido.forma_pagamento) || {
        forma: pedido.forma_pagamento,
        quantidade: 0,
        valorTotal: 0,
      };
      atual.quantidade += 1;
      atual.valorTotal += Number(pedido.total);
      mapa.set(pedido.forma_pagamento, atual);
    }

    const total = pedidosNoPeriodo.reduce((acc, p) => acc + Number(p.total), 0);

    return {
      ranking: Array.from(mapa.values()).sort((a, b) => b.valorTotal - a.valorTotal),
      totalGeral: total,
    };
  }, [pedidos, periodo]);

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-white">Ranking de Formas de Pagamento</h2>

      <FiltroPeriodo onMudar={setPeriodo} />

      {carregando && <p className="text-slate-400">Carregando...</p>}
      {!carregando && ranking.length === 0 && (
        <p className="text-slate-400">Nenhuma venda registrada nesse período.</p>
      )}

      {!carregando && ranking.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-onix-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-onix-surface text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Forma de pagamento</th>
                <th className="px-4 py-3 text-right">Nº de vendas</th>
                <th className="px-4 py-3 text-right">Valor total</th>
                <th className="px-4 py-3 text-right">% do faturamento</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((linha, indice) => (
                <tr key={linha.forma} className="border-t border-onix-border">
                  <td className="px-4 py-3 font-bold text-lobo-gold">{indice + 1}º</td>
                  <td className="px-4 py-3 text-white">{FORMA_PAGAMENTO_LABELS[linha.forma]}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{linha.quantidade}</td>
                  <td className="px-4 py-3 text-right font-semibold text-lobo-gold">
                    R$ {linha.valorTotal.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {totalGeral > 0 ? ((linha.valorTotal / totalGeral) * 100).toFixed(1) : '0.0'}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
