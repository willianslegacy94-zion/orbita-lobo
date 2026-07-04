interface StatCardProps {
  titulo: string;
  valor: string;
  tom?: 'gold' | 'default';
}

export function StatCard({ titulo, valor, tom = 'default' }: StatCardProps) {
  return (
    <div className="rounded-lg border border-onix-border bg-onix-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className={`mt-2 text-2xl font-bold ${tom === 'gold' ? 'text-lobo-gold' : 'text-white'}`}>{valor}</p>
    </div>
  );
}
