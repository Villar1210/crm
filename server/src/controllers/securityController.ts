import { Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { AuthRequest } from '../middleware/auth.js';


// ─── 2FA ──────────────────────────────────────────────────────────────────────

export const setup2FA = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.params.userId || req.user!.userId;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        const secret = speakeasy.generateSecret({
            name: `iVillar CRM (${user.email})`,
            issuer: 'iVillar',
            length: 32,
        });

        // Temporarily store secret (not yet enabled until verified)
        await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret.base32 } });

        const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

        res.json({ secret: secret.base32, qrCode: qrDataUrl, otpauthUrl: secret.otpauth_url });
    } catch (error) {
        console.error('[2FA] Setup error:', error);
        res.status(500).json({ error: 'Erro ao configurar 2FA' });
    }
};

export const enable2FA = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.params.userId || req.user!.userId;
        const { token } = req.body;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret) return res.status(400).json({ error: '2FA não configurado. Execute o setup primeiro.' });

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 1,
        });

        if (!verified) return res.status(400).json({ error: 'Código inválido' });

        // Generate 8 backup codes
        const rawCodes: string[] = Array.from({ length: 8 }, () =>
            Math.random().toString(36).substring(2, 8).toUpperCase()
        );
        const hashedCodes = await Promise.all(rawCodes.map(c => bcrypt.hash(c, 10)));

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true, backupCodes: JSON.stringify(hashedCodes) },
        });

        res.json({ ok: true, backupCodes: rawCodes });
    } catch (error) {
        console.error('[2FA] Enable error:', error);
        res.status(500).json({ error: 'Erro ao ativar 2FA' });
    }
};

export const disable2FA = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.params.userId || req.user!.userId;
        const { token } = req.body;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        // Super admins can disable for others without token
        if (req.user!.userId !== userId && req.user!.role === 'super_admin') {
            await prisma.user.update({
                where: { id: userId },
                data: { twoFactorEnabled: false, twoFactorSecret: null, backupCodes: null },
            });
            return res.json({ ok: true });
        }

        if (!token) return res.status(400).json({ error: 'Código TOTP obrigatório' });

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret!,
            encoding: 'base32',
            token,
            window: 1,
        });

        if (!verified) return res.status(400).json({ error: 'Código inválido' });

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: false, twoFactorSecret: null, backupCodes: null },
        });

        res.json({ ok: true });
    } catch (error) {
        console.error('[2FA] Disable error:', error);
        res.status(500).json({ error: 'Erro ao desativar 2FA' });
    }
};

// ─── Login Logs ───────────────────────────────────────────────────────────────

export const getLoginLogs = async (req: AuthRequest, res: Response) => {
    try {
        const { userId, limit = '50', page = '1' } = req.query;
        const take = Math.min(Number(limit), 200);
        const skip = (Number(page) - 1) * take;

        const where = userId ? { userId: String(userId) } : {};

        const [logs, total] = await Promise.all([
            prisma.loginLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take,
                skip,
                include: { user: { select: { name: true, email: true } } },
            }),
            prisma.loginLog.count({ where }),
        ]);

        res.json({ logs, total, page: Number(page), limit: take });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar logs' });
    }
};

// ─── User lock management ─────────────────────────────────────────────────────

export const unlockUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.user.update({
            where: { id },
            data: { loginAttempts: 0, lockedUntil: null },
        });
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao desbloquear usuário' });
    }
};

export const toggleUserActive = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        // Prevent super_admin from deactivating themselves
        if (user.id === req.user!.userId) {
            return res.status(400).json({ error: 'Você não pode desativar sua própria conta' });
        }

        await prisma.user.update({ where: { id }, data: { isActive: Boolean(isActive) } });
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao alterar status do usuário' });
    }
};

// ─── Security Settings ────────────────────────────────────────────────────────

const DEFAULT_SECURITY = {
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecial: false,
    sessionExpiryHours: 8,
    maxLoginAttempts: 5,
    lockDurationMinutes: 30,
    allowedIPs: '',
};

export const getSecuritySettings = async (_req: AuthRequest, res: Response) => {
    try {
        const settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
        const security = settings?.security ? { ...DEFAULT_SECURITY, ...JSON.parse(settings.security) } : DEFAULT_SECURITY;
        res.json(security);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar configurações de segurança' });
    }
};

export const updateSecuritySettings = async (req: AuthRequest, res: Response) => {
    try {
        const data = req.body;

        const current = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
        const existing = current?.security ? JSON.parse(current.security) : {};
        const merged = { ...DEFAULT_SECURITY, ...existing, ...data };

        await prisma.systemSettings.upsert({
            where: { id: 'default' },
            update: { security: JSON.stringify(merged) },
            create: { id: 'default', security: JSON.stringify(merged) },
        });

        res.json({ ok: true, settings: merged });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar configurações de segurança' });
    }
};

// ─── Admin: reset password ────────────────────────────────────────────────────

export const adminResetPassword = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({ where: { id }, data: { password: hashed, mustChangePassword: true } });

        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao resetar senha' });
    }
};
