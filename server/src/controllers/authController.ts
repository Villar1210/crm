import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';

const prisma = new PrismaClient();

if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getMaxLoginAttempts(): Promise<number> {
    try {
        const settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
        if (settings?.security) {
            const sec = JSON.parse(settings.security);
            return sec.maxLoginAttempts ?? 5;
        }
    } catch { /* ignore */ }
    return 5;
}

async function getLockDurationMinutes(): Promise<number> {
    try {
        const settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
        if (settings?.security) {
            const sec = JSON.parse(settings.security);
            return sec.lockDurationMinutes ?? 30;
        }
    } catch { /* ignore */ }
    return 30;
}

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, cpf, creci } = req.body;

        if (!email || !EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }
        if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um número' });
        }
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ error: 'Nome inválido' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'agent',
                cpf: cpf || null,
                creci: creci || null,
            },
        });

        res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const registerSuperAdmin = async (req: Request, res: Response) => {
    try {
        const { name, email, password, adminKey } = req.body;

        const ADMIN_REGISTRATION_KEY = process.env.ADMIN_REGISTRATION_KEY || 'ivillar-admin-key-2024';

        if (adminKey !== ADMIN_REGISTRATION_KEY) {
            return res.status(403).json({ error: 'Chave de administração inválida' });
        }

        if (!email || !EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }
        if (!password || password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 10 caracteres, uma letra maiúscula e um número' });
        }
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ error: 'Nome inválido' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Usuário já existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'super_admin',
            },
        });

        console.log(`[Auth] Super Admin registered: ${user.email}`);

        res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (error) {
        console.error('[Auth] Super Admin registration failed:', error);
        res.status(500).json({ error: 'Registro de Super Admin falhou' });
    }
};

export const login = async (req: Request, res: Response) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
        const { email, password, totpCode } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        console.log('[Auth] Login attempt');

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            await prisma.loginLog.create({ data: { email, ip, userAgent, success: false, failReason: 'user_not_found' } }).catch(() => {});
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is active
        if (user.isActive === false) {
            await prisma.loginLog.create({ data: { userId: user.id, email, ip, userAgent, success: false, failReason: 'account_disabled' } }).catch(() => {});
            return res.status(403).json({ error: 'Conta desativada. Contate o administrador.' });
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            await prisma.loginLog.create({ data: { userId: user.id, email, ip, userAgent, success: false, failReason: 'account_locked' } }).catch(() => {});
            return res.status(423).json({ error: `Conta bloqueada. Tente novamente em ${minutesLeft} minuto(s).` });
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            const maxAttempts = await getMaxLoginAttempts();
            const lockMinutes = await getLockDurationMinutes();
            const newAttempts = (user.loginAttempts || 0) + 1;

            if (newAttempts >= maxAttempts) {
                const lockedUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
                await prisma.user.update({ where: { id: user.id }, data: { loginAttempts: newAttempts, lockedUntil } });
                await prisma.loginLog.create({ data: { userId: user.id, email, ip, userAgent, success: false, failReason: 'invalid_password_locked' } }).catch(() => {});
                return res.status(423).json({ error: `Conta bloqueada por ${lockMinutes} minutos após ${maxAttempts} tentativas falhas.` });
            }

            await prisma.user.update({ where: { id: user.id }, data: { loginAttempts: newAttempts } });
            await prisma.loginLog.create({ data: { userId: user.id, email, ip, userAgent, success: false, failReason: 'invalid_password' } }).catch(() => {});
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check 2FA if enabled
        if (user.twoFactorEnabled && user.twoFactorSecret) {
            if (!totpCode) {
                return res.status(200).json({ requiresTwoFactor: true });
            }

            let twoFactorOk = false;
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: totpCode,
                window: 1,
            });

            if (verified) {
                twoFactorOk = true;
            } else if (user.backupCodes) {
                const codes: string[] = JSON.parse(user.backupCodes);
                const matchIdx = await Promise.all(codes.map(c => bcrypt.compare(totpCode, c)));
                const idx = matchIdx.findIndex(Boolean);
                if (idx !== -1) {
                    twoFactorOk = true;
                    codes.splice(idx, 1);
                    await prisma.user.update({ where: { id: user.id }, data: { backupCodes: JSON.stringify(codes) } });
                }
            }

            if (!twoFactorOk) {
                await prisma.loginLog.create({ data: { userId: user.id, email, ip, userAgent, success: false, failReason: 'invalid_2fa' } }).catch(() => {});
                return res.status(401).json({ error: 'Código 2FA inválido' });
            }
        }

        // Success
        await prisma.user.update({
            where: { id: user.id },
            data: { loginAttempts: 0, lockedUntil: null, lastLogin: new Date() },
        });

        await prisma.loginLog.create({ data: { userId: user.id, email, ip, userAgent, success: true } }).catch(() => {});

        console.log(`[Auth] Login successful for user id: ${user.id} (${user.role})`);

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                mustChangePassword: user.mustChangePassword || false,
            },
        });
    } catch (error) {
        console.error('[Auth] Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 8 ||
            !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return res.status(400).json({ error: 'Senha deve ter 8+ chars, 1 maiúscula e 1 número' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        if (currentPassword) {
            const valid = await bcrypt.compare(currentPassword, user.password);
            if (!valid) return res.status(400).json({ error: 'Senha atual incorreta' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashed, mustChangePassword: false }
        });

        res.json({ success: true, message: 'Senha alterada com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Falha ao alterar senha' });
    }
};
