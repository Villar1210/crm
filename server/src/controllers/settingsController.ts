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

// Get Site Settings
export const getSiteSettings = async (_req: Request, res: Response) => {
    try {
        let settings = await prisma.systemSettings.findUnique({
            where: { id: 'site' }
        });

        if (!settings) {
            const defaults = {
                companyName: 'Ivillar',
                tagline: 'Encontre o lugar ideal para sua história acontecer.',
                phone: '',
                email: '',
                address: '',
                instagram: '',
                facebook: '',
                whatsapp: '',
                footerText: 'Desenvolvido por Daniel Villar',
                primaryColor: '#4f46e5',
                logo: '',
            };
            settings = await prisma.systemSettings.create({
                data: {
                    id: 'site',
                    branding: JSON.stringify(defaults),
                    integrations: '[]',
                    security: '{}'
                }
            });
            return res.json(defaults);
        }

        const data = JSON.parse(settings.branding || '{}');
        res.json(data);
    } catch (error) {
        console.error('getSiteSettings error:', error);
        res.status(500).json({ error: 'Failed to fetch site settings' });
    }
};

// Update Site Settings
export const updateSiteSettings = async (req: Request, res: Response) => {
    try {
        const data = req.body;

        await prisma.systemSettings.upsert({
            where: { id: 'site' },
            create: {
                id: 'site',
                branding: JSON.stringify(data),
                integrations: '[]',
                security: '{}'
            },
            update: {
                branding: JSON.stringify(data)
            }
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('updateSiteSettings error:', error);
        res.status(500).json({ error: 'Failed to update site settings' });
    }
};
