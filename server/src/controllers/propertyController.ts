import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';


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

let cachedPublicProperties: any = null;
let publicCacheTimestamp = 0;
const PUBLIC_CACHE_TTL = 5 * 60 * 1000;

export const getPublicProperties = async (req: Request, res: Response) => {
    try {
        const hasFilters = Object.keys(req.query).length > 0;
        const now = Date.now();
        if (!hasFilters && cachedPublicProperties && (now - publicCacheTimestamp) < PUBLIC_CACHE_TTL) {
            return res.json(cachedPublicProperties);
        }

        const where: any = { status: 'active' };
        if (req.query.type) where.type = req.query.type;
        if (req.query.city) where.city = { contains: req.query.city as string };
        if (req.query.minPrice) where.price = { gte: parseFloat(req.query.minPrice as string) };
        if (req.query.maxPrice) where.price = { ...where.price, lte: parseFloat(req.query.maxPrice as string) };

        const properties = await prisma.property.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        const parsed = properties.map(p => ({
            ...p,
            images: safeParse(p.images),
            features: safeParse(p.features),
        }));

        if (!hasFilters) {
            cachedPublicProperties = parsed;
            publicCacheTimestamp = now;
        }

        res.json(parsed);
    } catch (error) {
        console.error('Public properties fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
};

export const getPropertyById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const property = await prisma.property.findUnique({ where: { id } });
        if (!property) return res.status(404).json({ error: 'Imovel nao encontrado' });
        res.json({
            ...property,
            images: safeParse(property.images),
            features: safeParse(property.features),
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar imovel' });
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
        cachedPublicProperties = null;
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
        cachedPublicProperties = null;
        res.json(property);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update property' });
    }
};

export const deleteProperty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.property.delete({ where: { id } });
        cachedPublicProperties = null;
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete property' });
    }
};
