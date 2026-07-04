import type { ItemCarrinho } from '../types';

interface CarrinhoItemRowProps {
  item: ItemCarrinho;
  onAlterarQuantidade: (produtoId: number, quantidade: number) => void;
  onRemover: (produtoId: number) => void;
}

export function CarrinhoItemRow({ item, onAlterarQuantidade, onRemover }: CarrinhoItemRowProps) {
  const subtotal = item.quantidade * Number(item.produto.preco_venda);

  return (
    <div className="flex items-center gap-2 border-b border-onix-border pb-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{item.produto.descricao}</p>
        <p className="text-xs text-slate-400">
          R$ {Number(item.produto.preco_venda).toFixed(2)} / {item.produto.unidade_medida}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onAlterarQuantidade(item.produto.id, item.quantidade - 1)}
          className="h-7 w-7 rounded-md bg-onix-surfaceHover text-white hover:bg-onix-border"
          aria-label="Diminuir quantidade"
        >
          −
        </button>
        <input
          type="number"
          min={0.01}
          step="0.01"
          value={item.quantidade}
          onChange={(e) => onAlterarQuantidade(item.produto.id, Number(e.target.value))}
          className="w-14 rounded-md border border-onix-border bg-black/30 px-1 py-1 text-center text-sm text-white"
        />
        <button
          type="button"
          onClick={() => onAlterarQuantidade(item.produto.id, item.quantidade + 1)}
          className="h-7 w-7 rounded-md bg-onix-surfaceHover text-white hover:bg-onix-border"
          aria-label="Aumentar quantidade"
        >
          +
        </button>
      </div>

      <div className="w-20 shrink-0 text-right text-sm font-semibold text-lobo-gold">
        R$ {subtotal.toFixed(2)}
      </div>

      <button
        type="button"
        onClick={() => onRemover(item.produto.id)}
        className="shrink-0 text-lg leading-none text-slate-500 hover:text-red-400"
        aria-label="Remover item"
      >
        ×
      </button>
    </div>
  );
}
