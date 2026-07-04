import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface UsuarioToken {
  id: number;
  nome: string;
  perfil: 'ADMIN' | 'VENDEDOR';
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioToken;
    }
  }
}

export function gerarToken(usuario: UsuarioToken): string {
  return jwt.sign(usuario, JWT_SECRET, { expiresIn: '12h' });
}

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Token não informado' });
    return;
  }

  try {
    req.usuario = jwt.verify(token, JWT_SECRET) as UsuarioToken;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

export function exigirAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.usuario?.perfil !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso restrito ao administrador' });
    return;
  }
  next();
}
