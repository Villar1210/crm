import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: { userId: string; role: string };
    headers: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const tokenFromCookie = req.cookies?.auth_token;
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
};

export const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
        }
        next();
    };
};
