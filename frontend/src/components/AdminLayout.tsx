import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getSessao, limparSessao } from '../lib/auth';

const LINKS = [
  { to: '/admin', label: 'Vendas do Dia', end: true },
  { to: '/admin/estoque', label: 'Estoque', end: false },
  { to: '/admin/ranking-produtos', label: 'Ranking de Produtos', end: false },
  { to: '/admin/ranking-pagamentos', label: 'Ranking de Pagamentos', end: false },
  { to: '/admin/fiado', label: 'Fiado', end: false },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const sessao = getSessao();

  return (
    <div className="flex min-h-screen bg-onix font-sans text-white">
      <aside className="w-56 shrink-0 border-r border-onix-border bg-gradient-to-b from-lobo-red/30 to-onix p-4">
        <h1 className="text-lg font-extrabold tracking-tight text-lobo-gold">DEPÓSITO LOBO</h1>
        <p className="mb-1 text-xs text-slate-400">Painel Administrativo</p>
        <p className="mb-6 text-xs font-semibold text-slate-300">{sessao?.usuario.nome}</p>

        <nav className="space-y-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-lobo-gold text-black' : 'text-slate-300 hover:bg-onix-surfaceHover'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <NavLink
          to="/"
          className="mt-8 block rounded-md border border-onix-border px-3 py-2 text-center text-sm font-medium text-slate-300 hover:bg-onix-surfaceHover"
        >
          ← Frente de Caixa
        </NavLink>

        <button
          type="button"
          onClick={() => {
            limparSessao();
            navigate('/login', { replace: true });
          }}
          className="mt-2 block w-full rounded-md border border-onix-border px-3 py-2 text-center text-sm font-medium text-slate-300 hover:bg-onix-surfaceHover"
        >
          Sair
        </button>
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
