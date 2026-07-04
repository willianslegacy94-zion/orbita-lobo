import type { Produto } from '../types';

interface ProdutoCardProps {
  produto: Produto;
  onAdicionar: (produto: Produto) => void;
}

export function ProdutoCard({ produto, onAdicionar }: ProdutoCardProps) {
  const semEstoque = Number(produto.qtd_atual) <= 0;

  return (
    <button
      type="button"
      onClick={() => onAdicionar(produto)}
      disabled={semEstoque}
      className="rounded-lg border border-onix-border bg-onix-surface p-3 text-left transition hover:border-lobo-gold hover:bg-onix-surfaceHover disabled:cursor-not-allowed disabled:opacity-40"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-lobo-gold">{produto.categoria}</p>
      <p className="mt-1 font-semibold text-white">{produto.descricao}</p>
      <p className="text-xs text-slate-400">
        {produto.sku} · {produto.unidade_medida} · estoque {Number(produto.qtd_atual).toFixed(0)}
      </p>
      <p className="mt-2 text-lg font-bold text-lobo-gold">
        R$ {Number(produto.preco_venda).toFixed(2)}
        {produto.unidade_medida === 'MT' && <span className="text-xs font-normal text-slate-400"> /metro</span>}
      </p>
      {semEstoque && <p className="mt-1 text-xs font-semibold text-red-400">Sem estoque</p>}
    </button>
  );
}
