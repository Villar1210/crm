import React, { useState, useEffect } from 'react';
import {
    ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell
} from 'recharts';
import {
    Send, Eye, MousePointer, Ban, Plus, FileText, Zap, TrendingUp, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';

const EmailDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [dateRange, setDateRange] = useState('30');

    useEffect(() => {
        fetchStats();
    }, [dateRange]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await api.email.getDashboardStats(dateRange);
            setStats(data);
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                    <p>Carregando dados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900">Email Marketing</h2>
                    <p className="text-gray-500 text-sm">Gerencie suas campanhas, automações e engajamento.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/admin/email-marketing/campaigns/new')}
                        className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Nova Campanha
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Sent */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Send size={80} className="text-brand-900" />
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Enviado</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-gray-900">{stats.totalSent?.toLocaleString()}</h3>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-brand-600 text-sm font-medium">
                        <TrendingUp size={16} /> <span>Envios</span> <span className="text-gray-400 font-normal">no período</span>
                    </div>
                </div>

                {/* Open Rate */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Eye size={80} className="text-green-600" />
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Taxa de Abertura</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-gray-900">{stats.avgOpenRate}%</h3>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-medium">
                        <ArrowUpRight size={16} /> <span>Engajamento</span> <span className="text-gray-400 font-normal">médio</span>
                    </div>
                </div>

                {/* Click Rate */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <MousePointer size={80} className="text-purple-600" />
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Taxa de Clique</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-gray-900">{stats.avgClickRate}%</h3>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-purple-600 text-sm font-medium">
                        <Zap size={16} /> <span>Conversão</span> <span className="text-gray-400 font-normal">estimada</span>
                    </div>
                </div>

                {/* Bounce Rate */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Ban size={80} className="text-red-600" />
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Taxa de Rejeição</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-gray-900">{stats.avgBounceRate}%</h3>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-red-500 text-sm font-medium">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> <span>Saúde</span> <span className="text-gray-400 font-normal">da lista</span>
                    </div>
                </div>
            </div>

            {/* Main Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800">Desempenho de Disparos</h3>
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg">
                        <button
                            onClick={() => setDateRange('7')}
                            className={`px-3 py-1 text-xs rounded-md transition-all font-medium ${dateRange === '7' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            7 dias
                        </button>
                        <button
                            onClick={() => setDateRange('30')}
                            className={`px-3 py-1 text-xs rounded-md transition-all font-medium ${dateRange === '30' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            30 dias
                        </button>
                        <button
                            onClick={() => setDateRange('90')}
                            className={`px-3 py-1 text-xs rounded-md transition-all font-medium ${dateRange === '90' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            90 dias
                        </button>
                    </div>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                            />
                            <Area type="monotone" dataKey="sent" name="Enviados" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorSent)" />
                            <Area type="monotone" dataKey="opened" name="Aberturas" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorOpen)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Quick Actions & Secondary Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Actions */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="font-bold text-gray-800 mb-4 px-1">Ações Rápidas</h3>

                    <button
                        onClick={() => navigate('/admin/email-marketing/campaigns/new')}
                        className="w-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-brand-500 hover:shadow-md transition-all group text-left flex items-center gap-4"
                    >
                        <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
                            <Plus size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Criar Campanha</p>
                            <p className="text-xs text-gray-500">Inicie um novo disparo de e-mail</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('/admin/email-marketing/campaigns')}
                        className="w-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-purple-500 hover:shadow-md transition-all group text-left flex items-center gap-4"
                    >
                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <FileText size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Ver Relatórios</p>
                            <p className="text-xs text-gray-500">Analise o desempenho detalhado</p>
                        </div>
                    </button>

                    <button
                        className="w-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-orange-500 hover:shadow-md transition-all group text-left flex items-center gap-4"
                    >
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <Zap size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Automações</p>
                            <p className="text-xs text-gray-500">Fluxos automáticos (Em breve)</p>
                        </div>
                    </button>
                </div>

                {/* Recent Activity / Last Campaign */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800">Último Disparo</h3>
                        {stats.lastCampaign && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${stats.lastCampaign.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                {stats.lastCampaign.status === 'sent' ? 'Enviado' : stats.lastCampaign.status}
                            </span>
                        )}
                    </div>

                    {stats.lastCampaign ? (
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1 space-y-4 w-full">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900">{stats.lastCampaign.name}</h4>
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                        <Send size={14} /> Enviado em {new Date(stats.lastCampaign.sentAt).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-gray-900">{stats.lastCampaign.openRate}%</p>
                                        <p className="text-xs text-gray-500 font-medium uppercase">Abertura</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-gray-900">{stats.lastCampaign.clickRate}%</p>
                                        <p className="text-xs text-gray-500 font-medium uppercase">Cliques</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-gray-900">{stats.lastCampaign.recipientCount.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 font-medium uppercase">Enviados</p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-1/3 flex flex-col items-center justify-center bg-brand-50 rounded-xl p-6 border border-brand-100">
                                <PieChart width={120} height={120}>
                                    <Pie
                                        data={[
                                            { name: 'Aberto', value: stats.lastCampaign.openRate, fill: '#16a34a' },
                                            { name: 'Não Aberto', value: 100 - stats.lastCampaign.openRate, fill: '#e2e8f0' }
                                        ]}
                                        cx={60}
                                        cy={60}
                                        innerRadius={40}
                                        outerRadius={55}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill="#16a34a" />
                                        <Cell fill="#e2e8f0" />
                                    </Pie>
                                </PieChart>
                                <p className="mt-2 text-sm font-semibold text-gray-700">Engajamento Total</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Send size={32} className="mb-2 opacity-50" />
                            <p>Nenhuma campanha recente encontrada</p>
                            <button
                                onClick={() => navigate('/admin/email-marketing/campaigns/new')}
                                className="mt-4 text-brand-600 font-medium hover:underline text-sm"
                            >
                                Criar primeira campanha
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailDashboard;
