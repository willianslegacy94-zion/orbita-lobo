import { useState } from 'react';
import type { Produto } from '../types';

interface ModalMetragemProps {
  produto: Produto;
  onConfirmar: (quantidade: number) => void;
  onFechar: () => void;
}

export function ModalMetragem({ produto, onConfirmar, onFechar }: ModalMetragemProps) {
  const [metros, setMetros] = useState(1);
  const subtotal = metros * Number(produto.preco_venda);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-lg border border-onix-border bg-onix-surface p-6">
        <h3 className="text-lg font-bold text-white">{produto.descricao}</h3>
        <p className="mb-4 text-xs text-slate-400">R$ {Number(produto.preco_venda).toFixed(2)} por metro</p>

        <label className="block text-xs font-semibold text-slate-400">
          Quantos metros?
          <input
            type="number"
            min={0.01}
            step="0.01"
            autoFocus
            value={metros}
            onChange={(e) => setMetros(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-onix-border bg-black/30 px-3 py-2 text-lg text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
          />
        </label>

        <div className="mt-4 flex items-center justify-between rounded-md bg-black/30 px-3 py-2">
          <span className="text-sm text-slate-300">Valor calculado</span>
          <span className="text-lg font-bold text-lobo-gold">R$ {subtotal.toFixed(2)}</span>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 rounded-md border border-onix-border py-2 text-sm font-semibold text-slate-300 hover:bg-onix-surfaceHover"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => metros > 0 && onConfirmar(metros)}
            disabled={metros <= 0}
            className="flex-1 rounded-md bg-lobo-gold py-2 text-sm font-bold text-black transition hover:bg-lobo-goldDark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Adicionar ao carrinho
          </button>
        </div>
      </div>
    </div>
  );
}
