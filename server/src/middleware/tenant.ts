import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from './auth';

// Preenche req.tenantId para uso opcional em controllers que precisem
// filtrar por tenant. super_admin nao tem tenantId (acesso a tudo).
export const tenantFilter = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === 'super_admin') return next();
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: { accountId: true },
        });
        (req as any).tenantId = user?.accountId || undefined;
    } catch { /* segue sem tenantId */ }
    next();
};
