import { EMPRESA_CNPJ, EMPRESA_ENDERECO, EMPRESA_NOME } from '../config';
import { FORMA_PAGAMENTO_LABELS } from '../lib/formaPagamento';
import type { FormaPagamento, ItemCarrinho } from '../types';

export interface ComprovanteData {
  pedidoId: number;
  criadoEm: string;
  clienteNome: string;
  formaPagamento: FormaPagamento;
  itens: ItemCarrinho[];
  total: number;
}

interface CupomProps {
  dados: ComprovanteData;
  onFechar: () => void;
}

export function Cupom({ dados, onFechar }: CupomProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print:static print:bg-transparent print:p-0">
      <div
        id="cupom-impressao"
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-lg bg-white p-6 text-black print:max-h-none print:w-full print:rounded-none print:shadow-none"
      >
        <div className="text-center">
          <p className="text-lg font-extrabold">{EMPRESA_NOME}</p>
          <p className="text-xs">CNPJ: {EMPRESA_CNPJ}</p>
          <p className="text-xs">{EMPRESA_ENDERECO}</p>
          <p className="mt-2 text-xs text-gray-500">Comprovante de venda — não é documento fiscal</p>
        </div>

        <div className="my-3 border-t border-dashed border-gray-400" />

        <div className="text-xs">
          <p>Venda #{dados.pedidoId}</p>
          <p>{new Date(dados.criadoEm).toLocaleString('pt-BR')}</p>
          <p>Cliente: {dados.clienteNome}</p>
          <p>Pagamento: {FORMA_PAGAMENTO_LABELS[dados.formaPagamento]}</p>
        </div>

        <div className="my-3 border-t border-dashed border-gray-400" />

        <table className="w-full text-xs">
          <thead>
            <tr className="text-left">
              <th className="pb-1">Item</th>
              <th className="pb-1 text-right">Qtd</th>
              <th className="pb-1 text-right">Unit.</th>
              <th className="pb-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {dados.itens.map((item) => (
              <tr key={item.produto.id}>
                <td className="py-0.5 pr-1">{item.produto.descricao}</td>
                <td className="py-0.5 text-right">{item.quantidade}</td>
                <td className="py-0.5 text-right">{Number(item.produto.preco_venda).toFixed(2)}</td>
                <td className="py-0.5 text-right">
                  {(item.quantidade * Number(item.produto.preco_venda)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="my-3 border-t border-dashed border-gray-400" />

        <div className="flex justify-between text-sm font-bold">
          <span>Total</span>
          <span>R$ {dados.total.toFixed(2)}</span>
        </div>

        <div className="my-3 border-t border-dashed border-gray-400" />

        <p className="text-center text-sm font-semibold">Obrigado pela preferência!</p>

        <div className="mt-6 flex gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 rounded-md bg-black py-2 text-sm font-bold text-white"
          >
            Imprimir
          </button>
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 rounded-md border border-gray-300 py-2 text-sm font-semibold text-gray-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
