import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPlans = async (req: Request, res: Response) => {
    try {
        const plans = await prisma.saasPlan.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar planos' });
    }
};

export const createPlan = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const plan = await prisma.saasPlan.create({
            data: {
                ...data,
                modulesIncluded: JSON.stringify(data.modulesIncluded || [])
            }
        });
        res.status(201).json(plan);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar plano' });
    }
};

export const updatePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const plan = await prisma.saasPlan.update({
            where: { id },
            data: {
                ...data,
                modulesIncluded: JSON.stringify(data.modulesIncluded || [])
            }
        });
        res.json(plan);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar plano' });
    }
};

export const getAccounts = async (req: Request, res: Response) => {
    try {
        const accounts = await prisma.saasAccount.findMany({
            include: { plan: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar contas' });
    }
};

export const createAccount = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const account = await prisma.saasAccount.create({
            data: {
                ...data,
                modulesEnabled: JSON.stringify(data.modulesEnabled || [])
            }
        });
        res.status(201).json(account);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
};

export const getInvoices = async (req: Request, res: Response) => {
    try {
        const invoices = await prisma.saasInvoice.findMany({
            include: { account: true, plan: true }
        });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar faturas' });
    }
};

export const getEvents = async (req: Request, res: Response) => {
    try {
        const events = await prisma.saasEvent.findMany({
            orderBy: { timestamp: 'desc' },
            take: 50
        });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar eventos' });
    }
};
