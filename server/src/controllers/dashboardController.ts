import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dashboardController = {
    getStats: async (req: Request, res: Response) => {
        void req;
        try {
            // 1. Fetch all leads needed for calculation
            // For a real prod app, we would filter by date, but for now fetch all to match "Overview"
            const leads = await prisma.lead.findMany({
                include: { user: true }
            });

            // 2. Define assumptions for statuses
            // Assuming 'Venda' or 'Fechado' means sold. 
            // If we don't have these exact statuses in DB yet, we might get 0. 
            // We'll treat any status containing 'Fechado', 'Venda', 'Ganho' as a sale.
            const SALE_STATUSES = ['Fechado', 'Venda', 'Ganho', 'Contrato Assinado'];

            // 3. Financials
            const closedLeads = leads.filter(l => SALE_STATUSES.includes(l.status) && l.value);

            const vgv = closedLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);
            const salesCount = closedLeads.length;
            const totalLeads = leads.length;

            const avgTicket = salesCount > 0 ? vgv / salesCount : 0;
            const conversionRate = totalLeads > 0 ? ((salesCount / totalLeads) * 100).toFixed(1) : '0';

            const commissions = vgv * 0.05; // Assuming 5% avg commission

            // 4. Sales Funnel (Group by Status)
            // We'll create a map of status -> count
            const funnelMap: Record<string, number> = {};
            leads.forEach(l => {
                const s = l.status || 'Novo';
                funnelMap[s] = (funnelMap[s] || 0) + 1;
            });

            // Transform to array format expected by frontend
            // We might want to order them logicallly if possible, but frontend handles some mapping.
            // Ideally we match the "Pipeline" stages.
            const funnel = Object.entries(funnelMap).map(([stage, count]) => ({
                stage,
                count,
                fill: SALE_STATUSES.includes(stage) ? '#22c55e' : (stage === 'Perdido' ? '#ef4444' : '#3b82f6')
            }));

            // 5. Lead Sources
            const sourceMap: Record<string, number> = {};
            leads.forEach(l => {
                const s = l.source || 'Desconhecido';
                sourceMap[s] = (sourceMap[s] || 0) + 1;
            });
            const leadSources = Object.entries(sourceMap).map(([name, value], idx) => ({
                name,
                value: Number(((value / totalLeads) * 100).toFixed(1)),
                fill: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][idx % 4]
            }));

            // 6. Top Agents
            // Group by assignedTo (User)
            const agentMap: Record<string, { name: string, sales: number, deals: number, avatar: string }> = {};

            closedLeads.forEach(l => {
                if (l.user) {
                    if (!agentMap[l.user.email]) {
                        agentMap[l.user.email] = {
                            name: l.user.name,
                            sales: 0,
                            deals: 0,
                            avatar: l.user.avatar || 'https://i.pravatar.cc/150?u=' + l.user.id
                        };
                    }
                    agentMap[l.user.email].sales += (l.value || 0);
                    agentMap[l.user.email].deals += 1;
                }
            });

            const topAgents = Object.values(agentMap)
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 5)
                .map((a, i) => ({
                    id: String(i),
                    ...a,
                    lost: 0, // Need logic for lost
                    avgTime: '3 dias', // Placeholder
                    avgTicket: a.deals > 0 ? a.sales / a.deals : 0
                }));

            // 7. Recent Activities
            // We will assume newly created leads are activities
            // Sort leads by createdAt desc
            const sortedLeads = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

            const activities = sortedLeads.map(l => ({
                id: l.id,
                user: l.source || 'Sistema',
                action: 'criou novo lead',
                target: l.name,
                time: new Date(l.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                type: 'lead'
            }));

            // 8. Properties Types (Use Lead Interest or Property Table?)
            // We'll use Lead.interest if available, else Mock for now or query Properties.
            // Let's query properties count just to have real data there too?
            // Or aggreg leads by interest
            const typeMap: Record<string, number> = {};
            leads.forEach(l => {
                if (l.interest) {
                    typeMap[l.interest] = (typeMap[l.interest] || 0) + 1;
                }
            });
            const propertyTypes = Object.entries(typeMap).map(([name, value]) => ({
                name,
                value,
                fill: '#8884d8'
            }));


            res.json({
                financials: {
                    vgv,
                    commissions,
                    avgTicket,
                    conversionRate,
                    revenueData: [] // TODO: Build monthly data
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
