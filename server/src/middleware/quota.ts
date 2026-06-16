import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from './auth';

// Middleware opcional para checar limites de plano antes de criar recursos.
// Ainda nao esta conectado a nenhuma rota - aplicar manualmente onde fizer
// sentido (ex: router.post('/users', checkQuota('users'), createUser)),
// depois de validar com dados reais de contas SaaS em produção.
export const checkQuota = (resource: 'users' | 'properties' | 'campaigns') =>
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (req.user?.role === 'super_admin') return next();

        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: { account: { include: { plan: true } } },
        });

        const plan = user?.account?.plan;
        if (!plan) return next();

        const limits: Record<string, number | null | undefined> = {
            users: plan.maxUsers,
            properties: plan.maxProperties,
            campaigns: plan.maxCampaigns,
        };

        const maxAllowed = limits[resource];
        if (!maxAllowed) return next();

        const counts: Record<string, () => Promise<number>> = {
            users: () => prisma.user.count({ where: { accountId: user!.accountId! } }),
            properties: () => prisma.property.count({ where: { tenantId: user!.accountId! } }),
            campaigns: () => prisma.campaign.count({}),
        };

        const current = await counts[resource]();
        if (current >= maxAllowed) {
            return res.status(402).json({
                error: `Limite do plano atingido: ${current}/${maxAllowed} ${resource}. Faca upgrade para continuar.`,
            });
        }
        next();
    };
