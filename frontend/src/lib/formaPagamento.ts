import type { FormaPagamento } from '../types';

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'PIX',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
  FIADO: 'Fiado',
};

export const FORMAS_PAGAMENTO: FormaPagamento[] = ['DINHEIRO', 'PIX', 'DEBITO', 'CREDITO', 'FIADO'];

export function linkWhatsapp(telefone: string, mensagem: string): string {
  const digitos = telefone.replace(/\D/g, '');
  const numeroComDdi = digitos.startsWith('55') ? digitos : `55${digitos}`;
  return `https://wa.me/${numeroComDdi}?text=${encodeURIComponent(mensagem)}`;
}
