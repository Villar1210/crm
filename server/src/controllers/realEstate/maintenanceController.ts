import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listTickets = async (req: Request, res: Response) => {
    try {
        const { propertyId, status } = req.query;
        const where: any = {};
        if (propertyId) where.propertyId = String(propertyId);
        if (status) where.status = String(status);

        const tickets = await prisma.maintenanceTicket.findMany({
            where,
            include: { property: true },
            orderBy: { createdAt: 'desc' }
        });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list tickets' });
    }
};

export const createTicket = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const ticket = await prisma.maintenanceTicket.create({
            data
        });
        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create ticket' });
    }
};

export const updateTicket = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const ticket = await prisma.maintenanceTicket.update({
            where: { id },
            data
        });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update ticket' });
    }
};
