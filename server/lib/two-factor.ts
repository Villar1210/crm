/**
 * Two-Factor Authentication Service
 * Handles 2FA setup and verification
 */

import { prisma } from '@/server/prisma';

export const twoFactor = {
    /**
     * Generate 2FA secret
     */
    generateSecret: (): string => {
        // In production, use 'speakeasy' library
        // For now, generate 6-digit code
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    /**
     * Enable 2FA for user
     */
    enable: async (userId: string) => {
        const secret = twoFactor.generateSecret();
        
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: secret,
                twoFactorEnabled: false, // Pending confirmation
            },
        });

        return { secret, message: 'Configurar em seu app autenticador' };
    },

    /**
     * Verify and confirm 2FA
     */
    confirm: async (userId: string, code: string) => {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user?.twoFactorSecret) {
            return { success: false, message: '2FA não configurado' };
        }

        // Simple verification for demo
        // In production, use proper TOTP verification
        if (code === user.twoFactorSecret) {
            await prisma.user.update({
                where: { id: userId },
                data: { twoFactorEnabled: true },
            });
            return { success: true, message: '2FA ativado com sucesso' };
        }

        return { success: false, message: 'Código inválido' };
    },

    /**
     * Disable 2FA
     */
    disable: async (userId: string) => {
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
        });

        return { success: true, message: '2FA desativado' };
    },
};
