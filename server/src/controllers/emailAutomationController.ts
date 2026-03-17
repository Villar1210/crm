import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Listar todas as automações
export const getAutomations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        const automations = await prisma.emailAutomation.findMany({
            where: { userId },
            include: {
                template: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Parse JSON fields
        const parsed = automations.map(auto => ({
            ...auto,
            conditions: auto.conditions ? JSON.parse(auto.conditions) : [],
            actions: JSON.parse(auto.actions)
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Erro ao buscar automações:', error);
        res.status(500).json({ error: 'Erro ao buscar automações' });
    }
};

// Buscar automação por ID
export const getAutomationById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const automation = await prisma.emailAutomation.findUnique({
            where: { id },
            include: {
                template: true
            }
        });

        if (!automation) {
            return res.status(404).json({ error: 'Automação não encontrada' });
        }

        const parsed = {
            ...automation,
            conditions: automation.conditions ? JSON.parse(automation.conditions) : [],
            actions: JSON.parse(automation.actions)
        };

        res.json(parsed);
    } catch (error) {
        console.error('Erro ao buscar automação:', error);
        res.status(500).json({ error: 'Erro ao buscar automação' });
    }
};

// Criar nova automação
export const createAutomation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const automationData = req.body;

        // Stringify JSON fields
        const data = {
            ...automationData,
            userId,
            conditions: automationData.conditions ? JSON.stringify(automationData.conditions) : null,
            actions: JSON.stringify(automationData.actions)
        };

        const automation = await prisma.emailAutomation.create({
            data,
            include: {
                template: true
            }
        });

        const parsed = {
            ...automation,
            conditions: automation.conditions ? JSON.parse(automation.conditions) : [],
            actions: JSON.parse(automation.actions)
        };

        res.status(201).json(parsed);
    } catch (error) {
        console.error('Erro ao criar automação:', error);
        res.status(500).json({ error: 'Erro ao criar automação' });
    }
};

// Atualizar automação
export const updateAutomation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Stringify JSON fields if present
        if (updateData.conditions) {
            updateData.conditions = JSON.stringify(updateData.conditions);
        }
        if (updateData.actions) {
            updateData.actions = JSON.stringify(updateData.actions);
        }

        const automation = await prisma.emailAutomation.update({
            where: { id },
            data: updateData,
            include: {
                template: true
            }
        });

        const parsed = {
            ...automation,
            conditions: automation.conditions ? JSON.parse(automation.conditions) : [],
            actions: JSON.parse(automation.actions)
        };

        res.json(parsed);
    } catch (error) {
        console.error('Erro ao atualizar automação:', error);
        res.status(500).json({ error: 'Erro ao atualizar automação' });
    }
};

// Deletar automação
export const deleteAutomation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.emailAutomation.delete({
            where: { id }
        });

        res.json({ message: 'Automação deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar automação:', error);
        res.status(500).json({ error: 'Erro ao deletar automação' });
    }
};

// Ativar/Desativar automação
export const toggleAutomation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body;

        const automation = await prisma.emailAutomation.update({
            where: { id },
            data: { enabled }
        });

        res.json({
            message: enabled ? 'Automação ativada' : 'Automação desativada',
            automation
        });
    } catch (error) {
        console.error('Erro ao alternar automação:', error);
        res.status(500).json({ error: 'Erro ao alternar automação' });
    }
};

// Testar trigger da automação
export const testAutomationTrigger = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { testData } = req.body;

        const automation = await prisma.emailAutomation.findUnique({
            where: { id },
            include: {
                template: true
            }
        });

        if (!automation) {
            return res.status(404).json({ error: 'Automação não encontrada' });
        }

        // Parse conditions
        const conditions = automation.conditions ? JSON.parse(automation.conditions) : [];

        // Avaliar condições
        let conditionsMet = true;
        for (const condition of conditions) {
            const fieldValue = testData[condition.field];

            switch (condition.operator) {
                case 'equals':
                    if (fieldValue !== condition.value) conditionsMet = false;
                    break;
                case 'not_equals':
                    if (fieldValue === condition.value) conditionsMet = false;
                    break;
                case 'contains':
                    if (!fieldValue?.includes(condition.value)) conditionsMet = false;
                    break;
                case 'greater':
                    if (!(fieldValue > condition.value)) conditionsMet = false;
                    break;
                case 'less':
                    if (!(fieldValue < condition.value)) conditionsMet = false;
                    break;
            }

            if (!conditionsMet) break;
        }

        res.json({
            triggered: conditionsMet,
            message: conditionsMet
                ? 'Automação seria disparada com estes dados'
                : 'Condições não atendidas, automação não seria disparada',
            conditions,
            testData
        });
    } catch (error) {
        console.error('Erro ao testar automação:', error);
        res.status(500).json({ error: 'Erro ao testar automação' });
    }
};

// Histórico de execuções
export const getAutomationHistory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Buscar jobs relacionados a esta automação
        const jobs = await prisma.jobQueue.findMany({
            where: {
                type: 'email_send',
                payload: {
                    contains: id
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json(jobs);
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
};

// Duplicar automação
export const duplicateAutomation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const original = await prisma.emailAutomation.findUnique({
            where: { id }
        });

        if (!original) {
            return res.status(404).json({ error: 'Automação não encontrada' });
        }

        const duplicate = await prisma.emailAutomation.create({
            data: {
                name: `${original.name} (Cópia)`,
                trigger: original.trigger,
                conditions: original.conditions,
                actions: original.actions,
                templateId: original.templateId,
                enabled: false,
                scheduleFrequency: original.scheduleFrequency,
                scheduleDelay: original.scheduleDelay,
                userId
            },
            include: {
                template: true
            }
        });

        const parsed = {
            ...duplicate,
            conditions: duplicate.conditions ? JSON.parse(duplicate.conditions) : [],
            actions: JSON.parse(duplicate.actions)
        };

        res.status(201).json(parsed);
    } catch (error) {
        console.error('Erro ao duplicar automação:', error);
        res.status(500).json({ error: 'Erro ao duplicar automação' });
    }
};

// Listar triggers disponíveis
export const getAvailableTriggers = async (_req: Request, res: Response) => {
    try {
        const triggers = [
            { id: 'new_lead', name: 'Novo Lead', description: 'Quando um novo lead é criado' },
            { id: 'status_change', name: 'Mudança de Status', description: 'Quando o status do lead muda' },
            { id: 'property_favorited', name: 'Imóvel Favoritado', description: 'Quando um lead favorita um imóvel' },
            { id: 'appointment_scheduled', name: 'Visita Agendada', description: 'Quando uma visita é agendada' },
            { id: 'stagnant_lead', name: 'Lead Estagnado', description: 'Lead sem interação há X dias' },
            { id: 'birthday', name: 'Aniversário', description: 'No aniversário do lead' },
            { id: 'custom', name: 'Personalizado', description: 'Condições personalizadas' }
        ];

        res.json(triggers);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar triggers' });
    }
};
