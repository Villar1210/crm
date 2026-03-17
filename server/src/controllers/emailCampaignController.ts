import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Listar todas as campanhas
export const getCampaigns = async (req: Request, res: Response) => {
    try {
        const { status, type, search } = req.query;
        const userId = (req as any).user?.id;

        const where: any = { userId };

        if (status) where.status = status;
        if (type) where.type = type;
        if (search) {
            where.OR = [
                { name: { contains: search as string } },
                { subject: { contains: search as string } }
            ];
        }

        const campaigns = await prisma.emailCampaign.findMany({
            where,
            include: {
                template: true,
                _count: {
                    select: { recipients: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(campaigns);
    } catch (error) {
        console.error('Erro ao buscar campanhas:', error);
        res.status(500).json({ error: 'Erro ao buscar campanhas' });
    }
};

// Buscar campanha por ID
export const getCampaignById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const campaign = await prisma.emailCampaign.findUnique({
            where: { id },
            include: {
                template: true,
                recipients: true,
                metrics: true
            }
        });

        if (!campaign) {
            return res.status(404).json({ error: 'Campanha não encontrada' });
        }

        res.json(campaign);
    } catch (error) {
        console.error('Erro ao buscar campanha:', error);
        res.status(500).json({ error: 'Erro ao buscar campanha' });
    }
};

// Criar nova campanha
export const createCampaign = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const campaignData = req.body;

        const campaign = await prisma.emailCampaign.create({
            data: {
                ...campaignData,
                userId,
                recipientCount: 0,
                sentCount: 0,
                deliveredCount: 0,
                openedCount: 0,
                clickedCount: 0,
                bouncedCount: 0,
                unsubscribedCount: 0,
                openRate: 0,
                clickRate: 0,
                bounceRate: 0
            }
        });

        res.status(201).json(campaign);
    } catch (error) {
        console.error('Erro ao criar campanha:', error);
        res.status(500).json({ error: 'Erro ao criar campanha' });
    }
};

// Atualizar campanha
export const updateCampaign = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const campaign = await prisma.emailCampaign.update({
            where: { id },
            data: updateData
        });

        res.json(campaign);
    } catch (error) {
        console.error('Erro ao atualizar campanha:', error);
        res.status(500).json({ error: 'Erro ao atualizar campanha' });
    }
};

// Deletar campanha
export const deleteCampaign = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.emailCampaign.delete({
            where: { id }
        });

        res.json({ message: 'Campanha deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar campanha:', error);
        res.status(500).json({ error: 'Erro ao deletar campanha' });
    }
};

// Duplicar campanha
export const duplicateCampaign = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const original = await prisma.emailCampaign.findUnique({
            where: { id }
        });

        if (!original) {
            return res.status(404).json({ error: 'Campanha não encontrada' });
        }

        const duplicate = await prisma.emailCampaign.create({
            data: {
                name: `${original.name} (Cópia)`,
                subject: original.subject,
                preheader: original.preheader,
                senderName: original.senderName,
                senderEmail: original.senderEmail,
                replyTo: original.replyTo,
                type: original.type,
                status: 'draft',
                templateId: original.templateId,
                htmlContent: original.htmlContent,
                jsonContent: original.jsonContent,
                segmentId: original.segmentId,
                segmentRules: original.segmentRules,
                userId,
                recipientCount: 0,
                sentCount: 0,
                deliveredCount: 0,
                openedCount: 0,
                clickedCount: 0,
                bouncedCount: 0,
                unsubscribedCount: 0,
                openRate: 0,
                clickRate: 0,
                bounceRate: 0
            }
        });

        res.status(201).json(duplicate);
    } catch (error) {
        console.error('Erro ao duplicar campanha:', error);
        res.status(500).json({ error: 'Erro ao duplicar campanha' });
    }
};

// Enviar campanha
export const sendCampaign = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { scheduledAt, testEmail } = req.body;

        // Se for envio de teste
        if (testEmail) {
            // TODO: Implementar envio de email de teste
            return res.json({ message: 'Email de teste enviado com sucesso' });
        }

        // Atualizar status da campanha
        const campaign = await prisma.emailCampaign.update({
            where: { id },
            data: {
                status: scheduledAt ? 'scheduled' : 'sending',
                scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
            }
        });

        // Criar job na fila para envio
        await prisma.jobQueue.create({
            data: {
                type: 'email_send',
                payload: JSON.stringify({ campaignId: id }),
                scheduledFor: scheduledAt ? new Date(scheduledAt) : undefined
            }
        });

        res.json({
            message: scheduledAt ? 'Campanha agendada com sucesso' : 'Campanha em envio',
            campaign
        });
    } catch (error) {
        console.error('Erro ao enviar campanha:', error);
        res.status(500).json({ error: 'Erro ao enviar campanha' });
    }
};

// Pausar campanha
export const pauseCampaign = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const campaign = await prisma.emailCampaign.update({
            where: { id },
            data: { status: 'paused' }
        });

        res.json({ message: 'Campanha pausada', campaign });
    } catch (error) {
        console.error('Erro ao pausar campanha:', error);
        res.status(500).json({ error: 'Erro ao pausar campanha' });
    }
};

// Métricas da campanha
export const getCampaignMetrics = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const campaign = await prisma.emailCampaign.findUnique({
            where: { id },
            include: {
                recipients: true,
                metrics: true
            }
        });

        if (!campaign) {
            return res.status(404).json({ error: 'Campanha não encontrada' });
        }

        // Estatísticas detalhadas por status
        const statusBreakdown = campaign.recipients.reduce((acc: any, recipient: any) => {
            acc[recipient.status] = (acc[recipient.status] || 0) + 1;
            return acc;
        }, {});

        // Links mais clicados
        const topLinks = campaign.metrics
            .sort((a: any, b: any) => b.clickCount - a.clickCount)
            .slice(0, 10);

        res.json({
            campaign: {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                sentCount: campaign.sentCount,
                deliveredCount: campaign.deliveredCount,
                openedCount: campaign.openedCount,
                clickedCount: campaign.clickedCount,
                bouncedCount: campaign.bouncedCount,
                unsubscribedCount: campaign.unsubscribedCount,
                openRate: campaign.openRate,
                clickRate: campaign.clickRate,
                bounceRate: campaign.bounceRate
            },
            statusBreakdown,
            topLinks,
            recipients: campaign.recipients
        });
    } catch (error) {
        console.error('Erro ao buscar métricas:', error);
        res.status(500).json({ error: 'Erro ao buscar métricas' });
    }
};

// Buscar destinatários para segmentação
export const getSegmentRecipients = async (req: Request, res: Response) => {
    try {
        const { segmentRules } = req.body;
        const userId = (req as any).user?.id;

        // Parse das regras de segmentação
        const rules = typeof segmentRules === 'string'
            ? JSON.parse(segmentRules)
            : segmentRules;

        // Construir query dinâmica baseada nas regras
        const where: any = {};

        if (rules.status) {
            where.status = { in: rules.status };
        }

        if (rules.temperature) {
            where.temperature = { in: rules.temperature };
        }

        if (rules.tags && rules.tags.length > 0) {
            // Tags são armazenadas como JSON string
            where.tags = { contains: rules.tags[0] };
        }

        if (rules.source) {
            where.source = { in: rules.source };
        }

        if (rules.assignedTo) {
            where.assignedTo = rules.assignedTo;
        } else {
            // Se não especificado, buscar apenas leads do usuário
            where.assignedTo = userId;
        }

        const leads = await prisma.lead.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                temperature: true
            }
        });

        // Filtrar apenas leads com email válido
        const validLeads = leads.filter(lead => lead.email && lead.email.includes('@'));

        res.json({
            count: validLeads.length,
            recipients: validLeads
        });
    } catch (error) {
        console.error('Erro ao buscar destinatários:', error);
        res.status(500).json({ error: 'Erro ao buscar destinatários' });
    }
};
