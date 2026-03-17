import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get Global Settings
export const getSystemSettings = async (_req: Request, res: Response) => {
    try {
        let settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' }
        });

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    id: 'default',
                    branding: JSON.stringify({ logo: '', primaryColor: '#4f46e5' }),
                    integrations: '[]',
                    security: JSON.stringify({ twoFactor: false })
                }
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

// Update Global Settings
export const updateSystemSettings = async (req: Request, res: Response) => {
    try {
        const { id, updatedAt, ...data } = req.body;

        const settings = await prisma.systemSettings.upsert({
            where: { id: 'default' },
            create: { id: 'default', ...data },
            update: data
        });

        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
};
