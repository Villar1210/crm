

import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, DollarSign, Target, Activity, Award, ArrowUpRight, ArrowDownRight, Megaphone, Home, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MOCK_DASHBOARD_DATA, DEFAULT_PIPELINE } from '../../constants';
import { User, Pipeline } from '../../types';

const AdminDashboard: React.FC = () => {
  // Hardcode removal of mock data until confirmed clean
  const [data, setData] = useState<typeof MOCK_DASHBOARD_DATA | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [pipelines] = useState<Pipeline[]>([DEFAULT_PIPELINE]); // In future fetch from API
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(DEFAULT_PIPELINE.id);
  const [defaultDashboardPipelineId, setDefaultDashboardPipelineId] = useState<string>(DEFAULT_PIPELINE.id);

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load persisted dashboard preference
    const savedDefault = localStorage.getItem('dashboard_default_pipeline_id');
    if (savedDefault) {
      setDefaultDashboardPipelineId(savedDefault);
      setSelectedPipelineId(savedDefault);
    }
  }, []);

  const handleSetDefault = () => {
    const newDefault = selectedPipelineId;
    setDefaultDashboardPipelineId(newDefault);
    localStorage.setItem('dashboard_default_pipeline_id', newDefault);
  };

  const handlePrevPipeline = () => {
    const idx = pipelines.findIndex(p => p.id === selectedPipelineId);
    if (idx > 0) setSelectedPipelineId(pipelines[idx - 1].id);
    else setSelectedPipelineId(pipelines[pipelines.length - 1].id);
  };

  const handleNextPipeline = () => {
    const idx = pipelines.findIndex(p => p.id === selectedPipelineId);
    if (idx < pipelines.length - 1) setSelectedPipelineId(pipelines[idx + 1].id);
    else setSelectedPipelineId(pipelines[0].id);
  };

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId) || pipelines[0];

  // Map funnel data based on selected pipeline
  // If default, use mock. If custom, replicate mock logic or zero.
  const funnelData = useMemo(() => {
    if (selectedPipelineId === 'default' && data) return data.funnel;

    // Generate mock data for other pipelines based on stages
    return selectedPipeline.stages.map((stage, idx) => ({
      stage: stage.title,
      count: Math.floor(1000 / ((idx + 1) * 1.5)), // Decay fake data
      fill: stage.id === 'lost' ? '#ef4444' : stage.id === 'closed' ? '#22c55e' : '#3b82f6' // Simple color logic
    })).filter(s => s.count > 0);
  }, [selectedPipeline, data, selectedPipelineId]);


  useEffect(() => {
    const fetchData = async () => {
      const stats = await api.dashboard.getStats();
      const currentUser = api.auth.getCurrentUser();
      setData(stats);
      setUser(currentUser);
    };
    fetchData();
  }, []);

  if (!data || !user) return <div className="flex items-center justify-center h-full text-gray-400">Carregando dados...</div>;

  const isAdmin = user.role === 'admin' || user.role === 'super_admin';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Visão Geral</h2>
          <p className="text-gray-500 text-sm">Acompanhamento financeiro e operacional em tempo real.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs text-gray-400 font-bold uppercase">Última atualização</p>
          <p className="font-mono text-gray-700 capitalize">
            {format(currentDate, "EEEE, HH:mm'h'", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign size={80} className="text-brand-900" />
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">VGV (Volume Geral de Vendas)</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-gray-900">{data.financials.vgv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-medium">
            <TrendingUp size={16} /> <span>+12.5%</span> <span className="text-gray-400 font-normal">vs mês anterior</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target size={80} className="text-green-600" />
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Comissões Projetadas</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-gray-900">{data.financials.commissions.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-medium">
            <ArrowUpRight size={16} /> <span>+8.2%</span> <span className="text-gray-400 font-normal">sobre a meta</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users size={80} className="text-blue-600" />
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Ticket Médio</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-gray-900">{data.financials.avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-red-500 text-sm font-medium">
            <ArrowDownRight size={16} /> <span>-2.1%</span> <span className="text-gray-400 font-normal">oscilação normal</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity size={80} className="text-purple-600" />
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Taxa de Conversão</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-gray-900">{data.financials.conversionRate}%</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-medium">
            <TrendingUp size={16} /> <span>+0.5%</span> <span className="text-gray-400 font-normal">eficiência</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">Receita vs Meta</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs text-gray-500"><div className="w-2 h-2 rounded-full bg-brand-500"></div> Realizado</span>
              <span className="flex items-center gap-1 text-xs text-gray-500"><div className="w-2 h-2 rounded-full bg-gray-300"></div> Meta</span>
            </div>
          </div>
          <div className="h-[20rem]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.financials.revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(val) => `R$${val / 1000}k`} />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="target" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Funnel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">Funil de Vendas</h3>
            <div className="flex items-center gap-2">
              {pipelines.length > 1 && (
                <button onClick={handlePrevPipeline} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                  <ChevronLeft size={18} />
                </button>
              )}

              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-gray-700">{selectedPipeline.title}</span>
              </div>

              {pipelines.length > 1 && (
                <button onClick={handleNextPipeline} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                  <ChevronRight size={18} />
                </button>
              )}

              <div className="w-px h-4 bg-gray-200 mx-2"></div>

              <button
                onClick={handleSetDefault}
                className={`p-1 rounded-full transition-colors ${defaultDashboardPipelineId === selectedPipelineId ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}
                title={defaultDashboardPipelineId === selectedPipelineId ? "Funil padrão do Dashboard" : "Definir como padrão"}
              >
                <Star size={18} fill={defaultDashboardPipelineId === selectedPipelineId ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
          <div className="h-[20rem] flex flex-col justify-between relative">
            {funnelData?.map((stage, index) => (
              <div key={index} className="relative group">
                <div
                  className="h-10 rounded-lg flex items-center justify-between px-4 text-white text-sm font-bold shadow-sm transition-all hover:scale-[1.02]"
                  style={{
                    width: `${100 - (index * 15)}%`,
                    backgroundColor: stage.fill,
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}
                >
                  <span>{stage.stage}</span>
                  <span>{stage.count}</span>
                </div>
              </div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100">
              {/* Optional overlay info */}
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN ONLY SECTION: Advanced Analytics */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Lead Sources Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Megaphone size={20} className="text-brand-600" /> Origem dos Leads</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.leadSources}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.leadSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                {data.leadSources.map((source, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.fill }}></div>
                    <span className="text-gray-600 font-bold">{source.name}</span>
                    <span className="text-gray-400">({source.value}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Property Types Performance */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Home size={20} className="text-brand-600" /> Desempenho por Tipo</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.propertyTypes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                      {data.propertyTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Agents */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Award className="text-amber-500" size={20} /> Performance de Equipe</h3>
                <button className="text-brand-600 text-sm font-bold hover:underline">Exportar Relatório</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Corretor</th>
                      <th className="px-4 py-3">VGV (Vendas)</th>
                      <th className="px-4 py-3">Deals</th>
                      <th className="px-4 py-3">Perdidos</th>
                      <th className="px-4 py-3">Tempo Fechamento</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">Ticket Médio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(data.topAgents as any[])
                      .filter((agent: any) => !['Eduardo Santos', 'Camila Torres', 'Roberto Lima'].includes(agent.name))
                      .map((agent: any, index: number) => (
                        <tr key={agent.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                              {index + 1}
                            </span>
                            <img src={agent.avatar} alt="" className="w-8 h-8 rounded-full" />
                            <span className="font-medium text-gray-900">{agent.name}</span>
                          </td>
                          <td className="px-4 py-4 font-bold text-gray-700">
                            {agent.sales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-block bg-brand-50 text-brand-700 px-2 py-1 rounded text-xs font-bold">
                              {agent.deals}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-red-500 text-xs font-bold">
                            {agent.lost}
                          </td>
                          <td className="px-4 py-4 text-gray-600 text-xs font-bold">
                            {(agent as any).avgTime}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-gray-600">
                            {agent.avgTicket?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Activity className="text-gray-400" size={20} /> Feed em Tempo Real</h3>
              <div className="space-y-6">
                {(data.activities as any[])
                  .filter((a: any) => !['Eduardo Santos', 'Camila Torres', 'Roberto Lima'].includes(a.user))
                  .map((activity: any) => (
                    <div key={activity.id} className="flex gap-3 relative pb-6 last:pb-0 last:mb-0">
                      {/* Connector Line */}
                      <div className="absolute left-[0.9375rem] top-8 bottom-0 w-0.5 bg-gray-100 last:hidden"></div>

                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm ${activity.type === 'sale' ? 'bg-green-100 text-green-600' :
                        activity.type === 'visit' ? 'bg-purple-100 text-purple-600' :
                          activity.type === 'lead' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                        {activity.type === 'sale' ? <DollarSign size={14} /> :
                          activity.type === 'visit' ? <Users size={14} /> :
                            activity.type === 'lead' ? <Target size={14} /> : <TrendingUp size={14} />}
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">
                          <span className="font-bold">{activity.user}</span> {activity.action} <span className="text-brand-600 font-medium">{activity.target}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
