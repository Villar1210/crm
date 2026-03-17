import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dashboard de métricas gerais
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { startDate, endDate } = req.query;

        const where: any = { userId };

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
            };
        }

        // Buscar todas as campanhas
        const campaigns = await prisma.emailCampaign.findMany({
            where,
            include: {
                recipients: true
            }
        });

        // Calcular totais
        const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
        const totalOpened = campaigns.reduce((sum, c) => sum + c.openedCount, 0);
        const totalClicked = campaigns.reduce((sum, c) => sum + c.clickedCount, 0);
        const totalBounced = campaigns.reduce((sum, c) => sum + c.bouncedCount, 0);
        const totalUnsubscribed = campaigns.reduce((sum, c) => sum + c.unsubscribedCount, 0);

        const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
        const avgClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
        const avgBounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

        // Campanhas ativas
        const activeCampaigns = campaigns.filter(c =>
            c.status === 'sending' || c.status === 'scheduled'
        ).length;

        // Última campanha
        const lastCampaign = campaigns
            .filter(c => c.status === 'sent')
            .sort((a, b) => new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime())[0];

        // Dados para gráfico (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentCampaigns = await prisma.emailCampaign.findMany({
            where: {
                userId,
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            include: {
                recipients: true
            },
            orderBy: { createdAt: 'asc' }
        });

        // Agrupar por data
        const chartData: any = {};
        recentCampaigns.forEach(campaign => {
            const date = new Date(campaign.createdAt).toISOString().split('T')[0];

            if (!chartData[date]) {
                chartData[date] = { date, sent: 0, opened: 0, clicked: 0 };
            }

            chartData[date].sent += campaign.sentCount;
            chartData[date].opened += campaign.openedCount;
            chartData[date].clicked += campaign.clickedCount;
        });

        const chartDataArray = Object.values(chartData);

        res.json({
            totalSent,
            avgOpenRate: parseFloat(avgOpenRate.toFixed(2)),
            avgClickRate: parseFloat(avgClickRate.toFixed(2)),
            avgBounceRate: parseFloat(avgBounceRate.toFixed(2)),
            totalUnsubscribed,
            activeCampaigns,
            lastCampaign,
            chartData: chartDataArray
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
};

// Relatório detalhado de campanha
export const getCampaignReport = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const campaign = await prisma.emailCampaign.findUnique({
            where: { id },
            include: {
                recipients: true,
                metrics: true,
                template: true
            }
        });

        if (!campaign) {
            return res.status(404).json({ error: 'Campanha não encontrada' });
        }

        // Breakdown por status
        const statusBreakdown = campaign.recipients.reduce((acc: any, recipient: any) => {
            acc[recipient.status] = (acc[recipient.status] || 0) + 1;
            return acc;
        }, {});

        // Top links clicados
        const topLinks = campaign.metrics
            .sort((a: any, b: any) => b.clickCount - a.clickCount)
            .slice(0, 10);

        // Dispositivos
        const deviceBreakdown = campaign.recipients
            .filter((r: any) => r.device)
            .reduce((acc: any, recipient: any) => {
                acc[recipient.device!] = (acc[recipient.device!] || 0) + 1;
                return acc;
            }, {});

        // Localização
        const locationBreakdown = campaign.recipients
            .filter((r: any) => r.location)
            .reduce((acc: any, recipient: any) => {
                acc[recipient.location!] = (acc[recipient.location!] || 0) + 1;
                return acc;
            }, {});

        // Timeline de eventos
        const timeline: { type: string; date: Date; email: string }[] = [];

        campaign.recipients.forEach((recipient: any) => {
            if (recipient.sentAt) {
                timeline.push({ type: 'sent', date: recipient.sentAt, email: recipient.email });
            }
            if (recipient.openedAt) {
                timeline.push({ type: 'opened', date: recipient.openedAt, email: recipient.email });
            }
            if (recipient.clickedAt) {
                timeline.push({ type: 'clicked', date: recipient.clickedAt, email: recipient.email });
            }
        });

        timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        res.json({
            campaign: {
                id: campaign.id,
                name: campaign.name,
                subject: campaign.subject,
                status: campaign.status,
                sentAt: campaign.sentAt,
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
            deviceBreakdown,
            locationBreakdown,
            timeline: timeline.slice(0, 50),
            recipients: campaign.recipients
        });
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
};

// Exportar relatório CSV
export const exportCampaignReport = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const campaign = await prisma.emailCampaign.findUnique({
            where: { id },
            include: {
                recipients: true
            }
        });

        if (!campaign) {
            return res.status(404).json({ error: 'Campanha não encontrada' });
        }

        // Gerar CSV
        const headers = ['Email', 'Nome', 'Status', 'Enviado', 'Entregue', 'Aberto', 'Clicado', 'Aberturas', 'Cliques'];
        const rows = campaign.recipients.map((r: any) => [
            r.email,
            r.name || '',
            r.status,
            r.sentAt || '',
            r.deliveredAt || '',
            r.openedAt || '',
            r.clickedAt || '',
            r.openCount,
            r.clickCount
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=campanha-${campaign.id}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Erro ao exportar relatório:', error);
        res.status(500).json({ error: 'Erro ao exportar relatório' });
    }
};

// Comparar campanhas
export const compareCampaigns = async (req: Request, res: Response) => {
    try {
        const { campaignIds } = req.body;

        if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length < 2) {
            return res.status(400).json({ error: 'Forneça pelo menos 2 IDs de campanhas' });
        }

        const campaigns = await prisma.emailCampaign.findMany({
            where: {
                id: { in: campaignIds }
            },
            include: {
                _count: {
                    select: { recipients: true }
                }
            }
        });

        const comparison = campaigns.map(c => ({
            id: c.id,
            name: c.name,
            sentCount: c.sentCount,
            openRate: c.openRate,
            clickRate: c.clickRate,
            bounceRate: c.bounceRate,
            recipientCount: c.recipientCount,
            sentAt: c.sentAt
        }));

        res.json(comparison);
    } catch (error) {
        console.error('Erro ao comparar campanhas:', error);
        res.status(500).json({ error: 'Erro ao comparar campanhas' });
    }
};

// Heatmap de cliques
export const getClickHeatmap = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const metrics = await prisma.emailMetrics.findMany({
            where: { campaignId: id },
            orderBy: { clickCount: 'desc' }
        });

        // Calcular percentuais
        const totalClicks = metrics.reduce((sum, m) => sum + m.clickCount, 0);

        const heatmap = metrics.map(m => ({
            url: m.linkUrl,
            text: m.linkText,
            clicks: m.clickCount,
            percentage: totalClicks > 0 ? (m.clickCount / totalClicks) * 100 : 0
        }));

        res.json(heatmap);
    } catch (error) {
        console.error('Erro ao gerar heatmap:', error);
        res.status(500).json({ error: 'Erro ao gerar heatmap' });
    }
};
