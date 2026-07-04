import { useEffect, useState } from 'react';

export type PeriodoPreset = 'HOJE' | '7_DIAS' | 'MES' | 'PERSONALIZADO';

export interface RangeData {
  inicio: string;
  fim: string;
}

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

function calcularRange(preset: PeriodoPreset, personalizado: RangeData): RangeData {
  const hoje = new Date();

  if (preset === 'HOJE') return { inicio: hojeIso(), fim: hojeIso() };

  if (preset === '7_DIAS') {
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 6);
    return { inicio: seteDiasAtras.toISOString().slice(0, 10), fim: hojeIso() };
  }

  if (preset === 'MES') {
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return { inicio: primeiroDia.toISOString().slice(0, 10), fim: hojeIso() };
  }

  return personalizado;
}

const PRESETS: { valor: PeriodoPreset; label: string }[] = [
  { valor: 'HOJE', label: 'Hoje' },
  { valor: '7_DIAS', label: 'Últimos 7 dias' },
  { valor: 'MES', label: 'Mês' },
  { valor: 'PERSONALIZADO', label: 'Personalizado' },
];

interface FiltroPeriodoProps {
  onMudar: (range: RangeData) => void;
}

export function FiltroPeriodo({ onMudar }: FiltroPeriodoProps) {
  const [preset, setPreset] = useState<PeriodoPreset>('HOJE');
  const [personalizado, setPersonalizado] = useState<RangeData>({ inicio: hojeIso(), fim: hojeIso() });

  useEffect(() => {
    onMudar(calcularRange('HOJE', personalizado));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selecionarPreset(novoPreset: PeriodoPreset) {
    setPreset(novoPreset);
    onMudar(calcularRange(novoPreset, personalizado));
  }

  function atualizarPersonalizado(campo: keyof RangeData, valor: string) {
    const novo = { ...personalizado, [campo]: valor };
    setPersonalizado(novo);
    if (preset === 'PERSONALIZADO') onMudar(novo);
  }

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-onix-border bg-onix-surface p-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.valor}
            type="button"
            onClick={() => selecionarPreset(p.valor)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              preset === p.valor ? 'bg-lobo-gold text-black' : 'bg-onix-surfaceHover text-slate-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === 'PERSONALIZADO' && (
        <div className="flex items-end gap-2">
          <label className="block text-xs font-semibold text-slate-400">
            De
            <input
              type="date"
              value={personalizado.inicio}
              onChange={(e) => atualizarPersonalizado('inicio', e.target.value)}
              className="mt-1 rounded-md border border-onix-border bg-black/30 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-400">
            Até
            <input
              type="date"
              value={personalizado.fim}
              onChange={(e) => atualizarPersonalizado('fim', e.target.value)}
              className="mt-1 rounded-md border border-onix-border bg-black/30 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
            />
          </label>
        </div>
      )}
    </div>
  );
}
