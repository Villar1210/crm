/**
 * Email Verification Service
 * Handles email verification tokens and processes
 */

import { prisma } from '@/server/prisma';

export const emailVerification = {
    /**
     * Generate verification token
     */
    generateToken: async (email: string) => {
        // Generate random token
        const token = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
        
        // Set expiration to 24 hours
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        // Store token
        await prisma.verificationToken.create({
            data: {
                email,
                token,
                type: 'EMAIL_VERIFICATION',
                expires: expiresAt,
            },
        });
        
        return { token, expiresAt };
    },

    /**
     * Verify token and mark email as verified
     */
    verifyToken: async (token: string) => {
        const verification = await prisma.verificationToken.findFirst({
            where: {
                token,
                type: 'EMAIL_VERIFICATION',
                expires: { gt: new Date() },
            },
        });

        if (!verification) {
            return { success: false, message: 'Token inválido ou expirado' };
        }

        // Mark user as verified
        await prisma.user.update({
            where: { email: verification.email },
            data: { emailVerified: new Date() },
        });

        // Delete token
        await prisma.verificationToken.deleteMany({
            where: { email: verification.email, type: 'EMAIL_VERIFICATION' },
        });

        return { success: true, message: 'Email verificado com sucesso' };
    },

    /**
     * Resend verification email
     */
    resendToken: async (email: string) => {
        // Delete old tokens
        await prisma.verificationToken.deleteMany({
            where: { email, type: 'EMAIL_VERIFICATION' },
        });

        // Generate new token
        return emailVerification.generateToken(email);
    },

    /**
     * Check if email is verified
     */
    isVerified: async (email: string) => {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        return user?.emailVerified ? true : false;
    },
};
