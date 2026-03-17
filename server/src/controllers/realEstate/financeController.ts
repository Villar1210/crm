import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listInvoices = async (req: Request, res: Response) => {
    try {
        const { contractId, status } = req.query;

        const where: any = {};
        if (contractId) where.contractId = String(contractId);
        if (status) where.status = String(status);

        // Month filter logic (start/end date) would go here based on requirements
        // Simple equal check if relying on exact string or range

        const invoices = await prisma.realEstateInvoice.findMany({
            where,
            include: { contract: { include: { tenant: true, property: true } } },
            orderBy: { dueDate: 'asc' }
        });

        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list invoices' });
    }
};

export const payInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { paidAmount, paymentMethod, paidAt } = req.body;

        const invoice = await prisma.realEstateInvoice.update({
            where: { id },
            data: {
                status: 'paid',
                paidAmount: Number(paidAmount),
                paymentMethod: String(paymentMethod),
                paidAt: paidAt ? new Date(paidAt) : new Date()
            }
        });

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: 'Failed to pay invoice' });
    }
};

export const listPayouts = async (req: Request, res: Response) => {
    try {
        const { ownerId } = req.query;
        const where: any = {};
        if (ownerId) where.ownerId = String(ownerId);

        const payouts = await prisma.ownerPayout.findMany({
            where,
            include: { owner: { include: { person: true } } },
            orderBy: { createdAt: 'desc' }
        });

        res.json(payouts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list payouts' });
    }
};
