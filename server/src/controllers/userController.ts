import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
                createdAt: true
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
                role: role || 'agent'
            }
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
};
