import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const campaignController = {
    getAll: async (_req: Request, res: Response) => {
        try {
            const campaigns = await prisma.campaign.findMany({
                include: {
                    properties: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return res.json(campaigns);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            return res.status(500).json({ error: 'Failed to fetch campaigns' });
        }
    },

    getById: async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const campaign = await prisma.campaign.findUnique({
                where: { id },
                include: {
                    properties: true
                }
            });

            if (!campaign) {
                return res.status(404).json({ error: 'Campaign not found' });
            }

            return res.json(campaign);
        } catch (error) {
            console.error('Error fetching campaign:', error);
            return res.status(500).json({ error: 'Failed to fetch campaign' });
        }
    },

    create: async (req: Request, res: Response) => {
        const { title, description, discountPercentage, startDate, endDate, active, image, propertyIds } = req.body;

        try {
            const campaign = await prisma.campaign.create({
                data: {
                    title,
                    description,
                    discountPercentage: discountPercentage ? parseFloat(discountPercentage) : null,
                    startDate: new Date(startDate),
                    endDate: endDate ? new Date(endDate) : null,
                    active: active ?? true,
                    image,
                    properties: {
                        connect: propertyIds?.map((id: string) => ({ id })) || []
                    }
                },
                include: {
                    properties: true
                }
            });

            return res.status(201).json(campaign);
        } catch (error) {
            console.error('Error creating campaign:', error);
            return res.status(500).json({ error: 'Failed to create campaign' });
        }
    },

    update: async (req: Request, res: Response) => {
        const { id } = req.params;
        const { title, description, discountPercentage, startDate, endDate, active, image, propertyIds } = req.body;

        try {
            // First disconnect all properties if propertyIds is provided, then connect new ones
            // Or we can just set them if using set? Prisma allows set.

            const data: any = {
                title,
                description,
                discountPercentage: discountPercentage ? parseFloat(discountPercentage) : null,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : null, // Allow nulling out endDate
                active,
                image
            };

            // Clean undefined values
            Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

            if (propertyIds) {
                data.properties = {
                    set: propertyIds.map((pid: string) => ({ id: pid }))
                };
            }

            const campaign = await prisma.campaign.update({
                where: { id },
                data,
                include: {
                    properties: true
                }
            });

            return res.json(campaign);
        } catch (error) {
            console.error('Error updating campaign:', error);
            return res.status(500).json({ error: 'Failed to update campaign' });
        }
    },

    delete: async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            await prisma.campaign.delete({
                where: { id }
            });
            return res.status(204).send();
        } catch (error) {
            console.error('Error deleting campaign:', error);
            return res.status(500).json({ error: 'Failed to delete campaign' });
        }
    }
};
