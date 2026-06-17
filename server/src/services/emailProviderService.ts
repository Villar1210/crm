import nodemailer from 'nodemailer';
import { logger } from '../lib/logger';

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}

function getTransport() {
    const provider = process.env.EMAIL_PROVIDER || 'smtp';

    if (provider === 'resend') {
        return nodemailer.createTransport({
            host: 'smtp.resend.com',
            port: 465,
            secure: true,
            auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
        });
    }

    if (!process.env.SMTP_HOST) return null;

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; messageId?: string }> {
    const transport = getTransport();
    if (!transport) {
        logger.warn('[Email] Nenhum provider configurado (EMAIL_PROVIDER/SMTP_HOST) — email nao enviado');
        return { success: false };
    }

    try {
        const info = await transport.sendMail({
            from: opts.from || process.env.EMAIL_FROM || 'nao-responda@ivillar.com.br',
            to: opts.to,
            subject: opts.subject,
            html: opts.html,
        });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error(error, '[Email] Falha ao enviar email');
        return { success: false };
    }
}

export function injectTrackingPixel(html: string, recipientId: string, baseUrl: string): string {
    const pixel = `<img src="${baseUrl}/api/email/track/open/${recipientId}.gif" width="1" height="1" alt="" style="display:none" />`;
    if (html.includes('</body>')) return html.replace('</body>', `${pixel}</body>`);
    return html + pixel;
}

export function injectUnsubscribeLink(html: string, recipientId: string, baseUrl: string): string {
    const link = `<p style="font-size:12px;color:#888;text-align:center;margin-top:24px;"><a href="${baseUrl}/api/email/unsubscribe/${recipientId}">Descadastrar</a></p>`;
    if (html.includes('</body>')) return html.replace('</body>', `${link}</body>`);
    return html + link;
}
