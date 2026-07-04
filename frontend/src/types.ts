export interface Produto {
  id: number;
  sku: string;
  descricao: string;
  categoria: string;
  unidade_medida: string;
  peso_unitario_kg: string;
  qtd_atual: string;
  estoque_minimo: string;
  preco_custo: string;
  preco_venda: string;
  atualizado_em: string;
}

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'DEBITO' | 'CREDITO' | 'FIADO';
export type StatusEnvio = 'idle' | 'enviando' | 'sucesso' | 'erro';

export interface Pedido {
  id: number;
  cliente_nome: string;
  cliente_telefone: string | null;
  vendedor_id: number;
  forma_pagamento: FormaPagamento;
  total: string;
  fiado_pago: boolean;
  criado_em: string;
}

export interface ItemPedidoDetalhado {
  id: number;
  pedido_id: number;
  produto_id: number;
  quantidade: string;
  preco_unitario: string;
  produto_descricao: string;
  unidade_medida: string;
  criado_em: string;
  forma_pagamento: FormaPagamento;
}
