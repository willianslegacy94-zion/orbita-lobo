import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, EMPRESA_NOME } from '../config';
import { salvarSessao } from '../lib/auth';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Não foi possível entrar.');

      salvarSessao({ token: body.token, usuario: body.usuario });
      navigate(body.usuario.perfil === 'ADMIN' ? '/admin' : '/', { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-onix px-4 font-sans">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm rounded-lg border border-onix-border bg-onix-surface p-6"
      >
        <h1 className="mb-1 text-center text-xl font-extrabold text-lobo-gold">{EMPRESA_NOME}</h1>
        <p className="mb-6 text-center text-sm text-slate-400">Entrar no sistema</p>

        <label className="block text-xs font-semibold text-slate-400">
          Usuário
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-onix-border bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
            required
          />
        </label>

        <label className="mt-3 block text-xs font-semibold text-slate-400">
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mt-1 w-full rounded-md border border-onix-border bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
            required
          />
        </label>

        {erro && <p className="mt-3 text-sm font-medium text-red-400">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="mt-6 w-full rounded-md bg-lobo-gold py-2 font-bold text-black transition hover:bg-lobo-goldDark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
