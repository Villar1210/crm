import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SALE_STATUSES = ['Fechado', 'Venda', 'Ganho', 'Contrato Assinado', 'closed'];
const LOST_STATUSES = ['Perdido', 'lost'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const dashboardController = {
    getStats: async (req: Request, res: Response) => {
        void req;
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

            // Buscar todos os leads com usuário
            const leads = await prisma.lead.findMany({
                include: { user: true, tasks: true }
            });

            const totalLeads = leads.length;
            const leadsThisMonth = leads.filter(l => new Date(l.createdAt) >= startOfMonth).length;
            const leadsLastMonth = leads.filter(l => {
                const d = new Date(l.createdAt);
                return d >= startOfLastMonth && d <= endOfLastMonth;
            }).length;

            const leadsGrowth = leadsLastMonth > 0
                ? (((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100).toFixed(1)
                : '0';

            // Financeiros
            const closedLeads = leads.filter(l => SALE_STATUSES.includes(l.status) && l.value);
            const closedThisMonth = closedLeads.filter(l => new Date(l.updatedAt) >= startOfMonth);
            const closedLastMonth = closedLeads.filter(l => {
                const d = new Date(l.updatedAt);
                return d >= startOfLastMonth && d <= endOfLastMonth;
            });

            const vgv = closedLeads.reduce((acc, l) => acc + (l.value || 0), 0);
            const vgvThisMonth = closedThisMonth.reduce((acc, l) => acc + (l.value || 0), 0);
            const vgvLastMonth = closedLastMonth.reduce((acc, l) => acc + (l.value || 0), 0);
            const vgvGrowth = vgvLastMonth > 0
                ? (((vgvThisMonth - vgvLastMonth) / vgvLastMonth) * 100).toFixed(1)
                : '0';

            const salesCount = closedLeads.length;
            const avgTicket = salesCount > 0 ? vgv / salesCount : 0;
            const conversionRate = totalLeads > 0
                ? Number(((salesCount / totalLeads) * 100).toFixed(1))
                : 0;
            const commissions = vgv * 0.05;

            // Receita mensal dos últimos 6 meses (dados reais)
            const revenueData = Array.from({ length: 6 }, (_, i) => {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
                const nextMonth = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
                const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'short' });

                const revenue = closedLeads
                    .filter(l => {
                        const d = new Date(l.updatedAt);
                        return d >= monthDate && d < nextMonth;
                    })
                    .reduce((acc, l) => acc + (l.value || 0), 0);

                // Meta = média dos meses anteriores + 10%
                const target = revenue > 0 ? revenue * 1.1 : avgTicket * 3;

                return { month: monthName.replace('.', ''), revenue, target };
            });

            // Funil de vendas por status
            const funnelMap: Record<string, number> = {};
            leads.forEach(l => {
                const s = l.status || 'Novo';
                funnelMap[s] = (funnelMap[s] || 0) + 1;
            });

            const FUNNEL_ORDER = ['Novo', 'Em_Triagem', 'Qualificado', 'Visita_Agendada', 'Proposta', 'Negociacao', 'Fechado', 'Perdido'];
            const funnel = Object.entries(funnelMap)
                .sort(([a], [b]) => {
                    const ia = FUNNEL_ORDER.indexOf(a);
                    const ib = FUNNEL_ORDER.indexOf(b);
                    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
                })
                .map(([stage, count]) => ({
                    stage,
                    count,
                    fill: SALE_STATUSES.includes(stage) ? '#22c55e'
                        : LOST_STATUSES.includes(stage) ? '#ef4444'
                        : '#3b82f6'
                }));

            // Origem dos leads
            const sourceMap: Record<string, number> = {};
            leads.forEach(l => {
                const s = l.source || 'Direto';
                sourceMap[s] = (sourceMap[s] || 0) + 1;
            });
            const leadSources = Object.entries(sourceMap)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([name, value], idx) => ({
                    name,
                    value: totalLeads > 0 ? Number(((value / totalLeads) * 100).toFixed(1)) : 0,
                    fill: COLORS[idx % COLORS.length]
                }));

            // Top agentes
            const agentMap: Record<string, any> = {};
            leads.forEach(l => {
                if (!l.user) return;
                const key = l.user.id;
                if (!agentMap[key]) {
                    agentMap[key] = {
                        id: l.user.id,
                        name: l.user.name,
                        avatar: l.user.avatar || `https://i.pravatar.cc/150?u=${l.user.id}`,
                        sales: 0, deals: 0, lost: 0, totalLeads: 0
                    };
                }
                agentMap[key].totalLeads++;
                if (SALE_STATUSES.includes(l.status)) {
                    agentMap[key].deals++;
                    agentMap[key].sales += l.value || 0;
                }
                if (LOST_STATUSES.includes(l.status)) {
                    agentMap[key].lost++;
                }
            });

            const topAgents = Object.values(agentMap)
                .filter((a: any) => a.totalLeads > 0)
                .sort((a: any, b: any) => b.sales - a.sales)
                .slice(0, 5)
                .map((a: any) => ({
                    ...a,
                    avgTicket: a.deals > 0 ? a.sales / a.deals : 0,
                    conversionRate: a.totalLeads > 0
                        ? ((a.deals / a.totalLeads) * 100).toFixed(0) + '%'
                        : '0%'
                }));

            // Atividades recentes (leads criados/atualizados)
            const recentLeads = [...leads]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 8);

            const activities = recentLeads.map(l => ({
                id: l.id,
                user: l.user?.name || 'Sistema',
                action: 'novo lead cadastrado',
                target: l.name || 'Sem nome',
                time: new Date(l.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                }),
                type: 'lead',
                source: l.source
            }));

            // Tipos de imóvel de interesse
            const typeMap: Record<string, number> = {};
            leads.forEach(l => {
                if (l.interest) typeMap[l.interest] = (typeMap[l.interest] || 0) + 1;
            });
            const propertyTypes = Object.entries(typeMap)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([name, value], i) => ({
                    name, value, fill: COLORS[i % COLORS.length]
                }));

            // Temperaturas dos leads
            const tempMap: Record<string, number> = { hot: 0, warm: 0, cold: 0 };
            leads.forEach(l => {
                if (l.temperature && tempMap[l.temperature] !== undefined) {
                    tempMap[l.temperature]++;
                }
            });

            // Tarefas pendentes
            let pendingTasks = 0;
            let overdueTasks = 0;
            try {
                const tasks = await prisma.task.findMany({ where: { completed: false } });
                pendingTasks = tasks.length;
                overdueTasks = tasks.filter(t => new Date(t.dueDate) < now).length;
            } catch { /* tasks podem não existir */ }

            res.json({
                summary: {
                    totalLeads,
                    leadsThisMonth,
                    leadsGrowth: Number(leadsGrowth),
                    vgv,
                    vgvThisMonth,
                    vgvGrowth: Number(vgvGrowth),
                    conversionRate,
                    avgTicket,
                    commissions,
                    pendingTasks,
                    overdueTasks,
                    temperatures: tempMap
                },
                financials: {
                    vgv, commissions, avgTicket, conversionRate, revenueData
                },
                funnel,
                leadSources,
                topAgents,
                activities,
                propertyTypes
            });

        } catch (error) {
            console.error('Dashboard Stats Error:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    }
};
