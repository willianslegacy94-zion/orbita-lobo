import type { ReactNode } from 'react';

type BadgeTom = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gold';

const ESTILOS: Record<BadgeTom, string> = {
  success: 'border-green-600/40 bg-green-950/60 text-green-400',
  warning: 'border-amber-600/40 bg-amber-950/60 text-amber-400',
  error: 'border-red-600/40 bg-red-950/60 text-red-400',
  info: 'border-blue-600/40 bg-blue-950/60 text-blue-400',
  neutral: 'border-onix-border bg-onix-surfaceHover text-slate-300',
  gold: 'border-lobo-gold/40 bg-lobo-gold/10 text-lobo-gold',
};

interface BadgeProps {
  tom: BadgeTom;
  children: ReactNode;
}

export function Badge({ tom, children }: BadgeProps) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ESTILOS[tom]}`}>
      {children}
    </span>
  );
}
