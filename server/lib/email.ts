import { getEmailConfig } from '../email-config';
import nodemailer from 'nodemailer';

let emailService: any = null;

export async function getEmailService() {
    if (emailService) return emailService;

    const { config, provider } = getEmailConfig();

    if (provider === 'mock') {
        // Mock for testing
        return {
            sendVerificationEmail: async (email: string, token: string) => {
                console.log(`[MOCK] Verification email sent to ${email}`);
                console.log(`[MOCK] Token: ${token}`);
                return true;
            },
            sendPasswordResetEmail: async (email: string, token: string) => {
                console.log(`[MOCK] Password reset email sent to ${email}`);
                return true;
            },
            sendWelcomeEmail: async (email: string, name: string) => {
                console.log(`[MOCK] Welcome email sent to ${email}`);
                return true;
            },
        };
    }

    // Real email service with nodemailer
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.auth.user,
            pass: config.auth.pass,
        },
    });

    emailService = {
        sendVerificationEmail: async (email: string, token: string) => {
            const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;
            
            await transporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@ivillar.com.br',
                to: email,
                subject: 'Verifique seu email - IVILLAR CRM',
                html: `
                    <h1>Bem-vindo ao IVILLAR CRM!</h1>
                    <p>Clique no link abaixo para verificar seu email:</p>
                    <a href="${verificationUrl}">Verificar Email</a>
                    <p>Link expira em 24 horas.</p>
                `,
            });
            return true;
        },

        sendPasswordResetEmail: async (email: string, token: string) => {
            const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
            
            await transporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@ivillar.com.br',
                to: email,
                subject: 'Recuperar sua senha - IVILLAR CRM',
                html: `
                    <h1>Solicitação de Reset de Senha</h1>
                    <p>Clique no link abaixo para resetar sua senha:</p>
                    <a href="${resetUrl}">Resetar Senha</a>
                    <p>Link expira em 1 hora.</p>
                `,
            });
            return true;
        },

        sendWelcomeEmail: async (email: string, name: string) => {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@ivillar.com.br',
                to: email,
                subject: 'Bem-vindo ao IVILLAR CRM',
                html: `
                    <h1>Bem-vindo, ${name}!</h1>
                    <p>Sua conta foi criada com sucesso.</p>
                    <p>Você pode fazer login em: <a href="${process.env.NEXTAUTH_URL}">IVILLAR CRM</a></p>
                `,
            });
            return true;
        },
    };

    return emailService;
}
