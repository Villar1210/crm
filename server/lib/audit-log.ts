/**
 * Audit Logging Service
 * Track all important user actions
 */

import { prisma } from '@/server/prisma';
import { NextApiRequest } from 'next';

export const auditLog = {
    /**
     * Log an action
     */
    log: async (
        action: string,
        userId: string | null,
        details: any,
        req: NextApiRequest
    ) => {
        const ip = (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || '';

        await prisma.auditLog.create({
            data: {
                action,
                userId,
                ipAddress: ip,
                userAgent,
                details: JSON.stringify(details),
                timestamp: new Date(),
            },
        });
    },

    /**
     * Common logging methods
     */
    logUserCreated: (userId: string, email: string, req: NextApiRequest) =>
        auditLog.log('USER_CREATED', userId, { email }, req),

    logUserLogin: (userId: string, req: NextApiRequest) =>
        auditLog.log('USER_LOGIN', userId, {}, req),

    logPasswordReset: (userId: string, req: NextApiRequest) =>
        auditLog.log('PASSWORD_RESET', userId, {}, req),

    logEmailVerified: (userId: string, email: string, req: NextApiRequest) =>
        auditLog.log('EMAIL_VERIFIED', userId, { email }, req),

    log2FAEnabled: (userId: string, req: NextApiRequest) =>
        auditLog.log('2FA_ENABLED', userId, {}, req),

    logSuspiciousActivity: (userId: string | null, action: string, req: NextApiRequest) =>
        auditLog.log('SUSPICIOUS_ACTIVITY', userId, { action }, req),
};
