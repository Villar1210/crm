import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const safeParse = (value: string | null) => {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const getProperties = async (_req: Request, res: Response) => {
    try {
        const properties = await prisma.property.findMany({
            orderBy: { createdAt: 'desc' },
            include: { owner: true },
        });

        // Parse JSON fields safely
        const parsed = properties.map(p => ({
            ...p,
            images: safeParse(p.images),
            features: safeParse(p.features),
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Properties fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
};

export const createProperty = async (req: Request, res: Response) => {
    try {
        const data = req.body;

        const property = await prisma.property.create({
            data: {
                ...data,
                images: JSON.stringify(data.images || []),
                features: JSON.stringify(data.features || []),
            },
        });
        res.status(201).json(property);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create property' });
    }
};

export const updateProperty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updateData: any = { ...data };
        if (data.images) updateData.images = JSON.stringify(data.images);
        if (data.features) updateData.features = JSON.stringify(data.features);

        const property = await prisma.property.update({
            where: { id },
            data: updateData,
        });
        res.json(property);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update property' });
    }
};

export const deleteProperty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.property.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete property' });
    }
};
