import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';


// List Users
export const getUsers = async (_req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                settings: true,
                createdAt: true,
                isActive: true,
                lastLogin: true,
                loginAttempts: true,
                lockedUntil: true,
                twoFactorEnabled: true,
                mustChangePassword: true,
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Update User (Role/Settings)
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role, settings } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: {
                role,
                settings: settings ? JSON.stringify(settings) : undefined
            }
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
};

// Create User (Admin)
export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'agent',
                mustChangePassword: true
            }
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
};

// Reset User Password (Admin)
export const resetUserPassword = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({ where: { id }, data: { password: hashedPassword } });

        res.json({ success: true, message: 'Senha alterada com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset password' });
    }
};

// Delete User (Admin)
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const { notifications, theme, timezone, language } = req.body;
        const preferences = { notifications, theme, timezone, language };
        await prisma.user.update({
            where: { id: userId },
            data: { settings: JSON.stringify(preferences) },
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Falha ao salvar preferencias' });
    }
};

export const uploadAvatar = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

        const avatarUrl = `/uploads/${req.file.filename}`;
        const user = await prisma.user.update({
            where: { id },
            data: { avatar: avatarUrl }
        });

        res.json({ avatar: avatarUrl, user });
    } catch (error) {
        res.status(500).json({ error: 'Falha ao atualizar avatar' });
    }
};
