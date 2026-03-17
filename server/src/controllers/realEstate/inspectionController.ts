import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listInspections = async (req: Request, res: Response) => {
    try {
        const { propertyId, status } = req.query;
        const where: any = {};
        if (propertyId) where.propertyId = String(propertyId);
        if (status) where.status = String(status);

        const inspections = await prisma.inspection.findMany({
            where,
            include: { property: true, contract: true },
            orderBy: { date: 'asc' }
        });

        res.json(inspections);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list inspections' });
    }
};

export const createInspection = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const inspection = await prisma.inspection.create({
            data: {
                ...data,
                date: new Date(data.date)
            }
        });
        res.status(201).json(inspection);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create inspection' });
    }
};
