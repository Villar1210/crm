import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// List Users
export const getUsers = async (_req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                team: true,
                avatar: true,
                createdAt: true,
                isActive: true,
                lastLogin: true,
                loginAttempts: true,
                lockedUntil: true,
                twoFactorEnabled: true,
                mustChangePassword: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Create User (Admin)
export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, phone, team } = req.body;

        if (!name || name.trim().length < 2)
            return res.status(400).json({ error: 'Nome inválido' });
        if (!email || !EMAIL_REGEX.test(email))
            return res.status(400).json({ error: 'Email inválido' });
        if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
            return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um número' });

        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) return res.status(400).json({ error: 'E-mail já cadastrado' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { name: name.trim(), email, password: hashedPassword, role: role || 'agent', phone: phone || null, team: team || null },
            select: { id: true, name: true, email: true, role: true, phone: true, team: true, avatar: true, createdAt: true, isActive: true, mustChangePassword: true, twoFactorEnabled: true }
        });

        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
};

// Update User
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, role, phone, team } = req.body;

        if (email && !EMAIL_REGEX.test(email))
            return res.status(400).json({ error: 'Email inválido' });

        const user = await prisma.user.update({
            where: { id },
            data: {
                ...(name && { name: name.trim() }),
                ...(email && { email }),
                ...(role && { role }),
                ...(phone !== undefined && { phone: phone || null }),
                ...(team !== undefined && { team: team || null }),
            },
            select: { id: true, name: true, email: true, role: true, phone: true, team: true, avatar: true, createdAt: true, isActive: true, mustChangePassword: true, twoFactorEnabled: true }
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
};

// Change Password
export const changePassword = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword))
            return res.status(400).json({ error: 'Nova senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um número' });

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        // If currentPassword supplied, validate it (self-change). Admins can skip.
        if (currentPassword) {
            const valid = await bcrypt.compare(currentPassword, user.password);
            if (!valid) return res.status(400).json({ error: 'Senha atual incorreta' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({ where: { id }, data: { password: hashed } });

        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to change password' });
    }
};

// Delete User
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        await prisma.user.delete({ where: { id } });
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
