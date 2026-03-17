import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const taskController = {
    // Get tasks with filters
    getTasks: async (req: Request, res: Response) => {
        try {
            const { start, end, type, status, userId, leadId } = req.query;

            const where: any = {};

            if (start && end) {
                where.dueDate = {
                    gte: new Date(String(start)),
                    lte: new Date(String(end)),
                };
            }

            if (type) where.type = String(type);
            if (status === 'completed') where.completed = true;
            if (status === 'pending') where.completed = false;
            if (userId) where.userId = String(userId);
            if (leadId) where.leadId = String(leadId);

            const tasks = await prisma.task.findMany({
                where,
                include: {
                    lead: {
                        select: { name: true, phone: true }
                    },
                    user: {
                        select: { name: true, avatar: true }
                    }
                },
                orderBy: { dueDate: 'asc' }
            });

            res.json(tasks);
        } catch (error) {
            console.error('Get tasks error:', error);
            res.status(500).json({ error: 'Failed to fetch tasks' });
        }
    },

    // Create new task
    createTask: async (req: Request, res: Response) => {
        try {
            const { title, dueDate, type, notes, leadId, userId } = req.body;

            if (!title || !dueDate || !type) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const task = await prisma.task.create({
                data: {
                    title,
                    dueDate: new Date(dueDate),
                    type,
                    notes,
                    leadId: leadId || undefined,
                    userId: userId || undefined,
                    completed: false
                },
                include: {
                    lead: { select: { name: true } }
                }
            });

            res.status(201).json(task);
        } catch (error) {
            console.error('Create task error:', error);
            res.status(500).json({ error: 'Failed to create task' });
        }
    },

    // Update task
    updateTask: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { title, dueDate, type, notes, completed } = req.body;

            const data: any = {};
            if (title) data.title = title;
            if (dueDate) data.dueDate = new Date(dueDate);
            if (type) data.type = type;
            if (notes !== undefined) data.notes = notes;
            if (completed !== undefined) data.completed = completed;

            const task = await prisma.task.update({
                where: { id },
                data,
                include: {
                    lead: { select: { name: true } }
                }
            });

            res.json(task);
        } catch (error) {
            console.error('Update task error:', error);
            res.status(500).json({ error: 'Failed to update task' });
        }
    },

    // Delete task
    deleteTask: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await prisma.task.delete({ where: { id } });
            res.status(204).send();
        } catch (error) {
            console.error('Delete task error:', error);
            res.status(500).json({ error: 'Failed to delete task' });
        }
    }
};
