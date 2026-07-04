import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getSessao, type UsuarioAutenticado } from '../lib/auth';

interface RotaProtegidaProps {
  perfisPermitidos: UsuarioAutenticado['perfil'][];
  children: ReactNode;
}

export function RotaProtegida({ perfisPermitidos, children }: RotaProtegidaProps) {
  const sessao = getSessao();

  if (!sessao) {
    return <Navigate to="/login" replace />;
  }

  if (!perfisPermitidos.includes(sessao.usuario.perfil)) {
    return <Navigate to={sessao.usuario.perfil === 'ADMIN' ? '/admin' : '/'} replace />;
  }

  return <>{children}</>;
}
