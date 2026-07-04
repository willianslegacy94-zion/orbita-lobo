import { useEffect, useMemo, useState } from 'react';
import { FiltroPeriodo, type RangeData } from '../../components/FiltroPeriodo';
import { authFetch } from '../../lib/auth';
import type { ItemPedidoDetalhado } from '../../types';

interface LinhaRanking {
  descricao: string;
  unidadeMedida: string;
  quantidade: number;
  valorTotal: number;
}

export function AdminRankingProdutos() {
  const [itens, setItens] = useState<ItemPedidoDetalhado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState<RangeData | null>(null);

  useEffect(() => {
    authFetch('/api/itens-pedido')
      .then((res) => res.json())
      .then((data: ItemPedidoDetalhado[]) => setItens(Array.isArray(data) ? data : []))
      .finally(() => setCarregando(false));
  }, []);

  const ranking = useMemo(() => {
    if (!periodo) return [];

    const itensNoPeriodo = itens.filter((item) => {
      const data = item.criado_em.slice(0, 10);
      return data >= periodo.inicio && data <= periodo.fim;
    });

    const mapa = new Map<string, LinhaRanking>();
    for (const item of itensNoPeriodo) {
      const atual = mapa.get(item.produto_descricao) || {
        descricao: item.produto_descricao,
        unidadeMedida: item.unidade_medida,
        quantidade: 0,
        valorTotal: 0,
      };
      atual.quantidade += Number(item.quantidade);
      atual.valorTotal += Number(item.quantidade) * Number(item.preco_unitario);
      mapa.set(item.produto_descricao, atual);
    }

    return Array.from(mapa.values()).sort((a, b) => b.valorTotal - a.valorTotal);
  }, [itens, periodo]);

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-white">Ranking de Produtos Vendidos</h2>

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
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3 text-right">Quantidade</th>
                <th className="px-4 py-3 text-right">Valor vendido</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((linha, indice) => (
                <tr key={linha.descricao} className="border-t border-onix-border">
                  <td className="px-4 py-3 font-bold text-lobo-gold">{indice + 1}º</td>
                  <td className="px-4 py-3 text-white">{linha.descricao}</td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {linha.quantidade.toFixed(2)} {linha.unidadeMedida}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-lobo-gold">
                    R$ {linha.valorTotal.toFixed(2)}
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
