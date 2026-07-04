import { API_URL } from '../config';

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  perfil: 'ADMIN' | 'VENDEDOR';
}

interface SessaoArmazenada {
  token: string;
  usuario: UsuarioAutenticado;
}

const CHAVE_STORAGE = 'lobo_auth';

export function getSessao(): SessaoArmazenada | null {
  const bruto = localStorage.getItem(CHAVE_STORAGE);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as SessaoArmazenada;
  } catch {
    return null;
  }
}

export function salvarSessao(sessao: SessaoArmazenada) {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(sessao));
}

export function limparSessao() {
  localStorage.removeItem(CHAVE_STORAGE);
}

export async function authFetch(caminho: string, options: RequestInit = {}): Promise<Response> {
  const sessao = getSessao();
  const headers = new Headers(options.headers);
  if (sessao) headers.set('Authorization', `Bearer ${sessao.token}`);

  const res = await fetch(`${API_URL}${caminho}`, { ...options, headers });

  if (res.status === 401) {
    limparSessao();
    window.location.href = '/login';
  }

  return res;
}
