import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const systemController = {
    resetDatabase: async (req: Request, res: Response) => {
        const { password, type } = req.body;

        // Simple password protection (Hardcoded for now as per plan)
        // In real world, use env var: process.env.ADMIN_RESET_PASSWORD
        if (password !== 'admin') {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        try {
            console.log(`[System] Starting database reset (${type})...`);

            // Execute transaction to delete data in correct order to avoid FK constraints
            await prisma.$transaction(async (tx) => {
                // 1. Level 4 (Dependencies of dependencies)
                await tx.emailMetrics.deleteMany({});
                await tx.emailRecipient.deleteMany({});
                await tx.emailContact.deleteMany({});
                await tx.leadDocument.deleteMany({});
                await tx.leadRouletteLog.deleteMany({});

                // 2. Level 3 (Dependencies)
                await tx.task.deleteMany({});
                await tx.jobQueue.deleteMany({});
                await tx.leadRouletteAgent.deleteMany({});

                // 3. Level 2 (Modules)
                // EmailCampaign depends on EmailTemplate and User.
                // EmailAutomation depends on EmailTemplate and User.
                // EmailList depends on User.
                // We preserve EmailTemplate and User.
                await tx.emailCampaign.deleteMany({});
                await tx.emailAutomation.deleteMany({});
                await tx.emailList.deleteMany({});
                await tx.leadRouletteRule.deleteMany({});
                await tx.leadRouletteSettings.deleteMany({});

                // 4. Level 1 (Core Data)
                // Lead depends on User.
                // Property doesn't depend on much usually.
                await tx.lead.deleteMany({});
                await tx.property.deleteMany({});

                // NOT DELETING: User, EmailTemplate
            });

            console.log('[System] Database reset completed successfully.');
            return res.json({ success: true, message: 'Banco de dados limpo com sucesso.' });

        } catch (error) {
            console.error('[System] Database reset failed:', error);
            return res.status(500).json({ error: 'Falha ao limpar banco de dados.', details: String(error) });
        }
    }
};
