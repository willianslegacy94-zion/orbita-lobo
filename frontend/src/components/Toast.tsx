interface ToastProps {
  tipo: 'sucesso' | 'erro';
  mensagem: string;
}

export function Toast({ tipo, mensagem }: ToastProps) {
  const estilo =
    tipo === 'sucesso'
      ? 'border-green-600/40 bg-green-950/60 text-green-400'
      : 'border-red-600/40 bg-red-950/60 text-red-400';

  return <div className={`rounded-md border px-3 py-2 text-sm font-medium ${estilo}`}>{mensagem}</div>;
}
