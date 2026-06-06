import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, DollarSign, Target, Activity,
  Award, ArrowUpRight, ArrowDownRight, Flame, Snowflake, Zap,
  CheckCircle, AlertCircle, RefreshCw, Calendar, MessageSquare
} from 'lucide-react';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const fmtK = (v: number) => v >= 1_000_000 ? `R$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `R$${(v / 1_000).toFixed(0)}k` : fmt(v);

const KPI: React.FC<{
  label: string; value: string; sub?: string;
  trend?: number; icon: React.FC<any>; color: string;
}> = ({ label, value, sub, trend, icon: Icon, color }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend !== undefined && (
        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
          trend >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        }`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  const user = api.auth.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const stats = await api.dashboard.getStats();
      setData(stats);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
      <p className="text-gray-400 text-sm">Carregando dados do dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-red-500 text-sm">{error}</p>
      <button onClick={loadData} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700">
        Tentar novamente
      </button>
    </div>
  );

  const s = data?.summary || {};
  const financials = data?.financials || {};

  return (
    <div className="space-y-6 pb-12 animate-fade-in">

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
          <p className="text-gray-500 text-sm mt-0.5">Dados em tempo real do seu CRM</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Atualizado</p>
            <p className="text-sm font-semibold text-gray-700 capitalize">
              {format(currentDate, "EEE, HH:mm'h'", { locale: ptBR })}
            </p>
          </div>
          <button
            onClick={loadData}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Total de Leads"
          value={String(s.totalLeads || 0)}
          sub={`${s.leadsThisMonth || 0} este mês`}
          trend={s.leadsGrowth}
          icon={Users}
          color="bg-blue-100 text-blue-600"
        />
        <KPI
          label="VGV Total"
          value={fmtK(s.vgv || 0)}
          sub={`${fmtK(s.vgvThisMonth || 0)} este mês`}
          trend={s.vgvGrowth}
          icon={DollarSign}
          color="bg-green-100 text-green-600"
        />
        <KPI
          label="Taxa de Conversão"
          value={`${s.conversionRate || 0}%`}
          sub={`Ticket médio ${fmtK(s.avgTicket || 0)}`}
          icon={Target}
          color="bg-purple-100 text-purple-600"
        />
        <KPI
          label="Comissões Projetadas"
          value={fmtK(s.commissions || 0)}
          sub="5% sobre VGV fechado"
          icon={TrendingUp}
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{s.temperatures?.hot || 0}</p>
            <p className="text-xs text-gray-500">Leads quentes</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Snowflake className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{s.temperatures?.cold || 0}</p>
            <p className="text-xs text-gray-500">Leads frios</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            s.overdueTasks > 0 ? 'bg-red-100' : 'bg-green-100'
          }`}>
            <AlertCircle className={`w-4 h-4 ${s.overdueTasks > 0 ? 'text-red-500' : 'text-green-500'}`} />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{s.overdueTasks || 0}</p>
            <p className="text-xs text-gray-500">Tarefas atrasadas</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{s.pendingTasks || 0}</p>
            <p className="text-xs text-gray-500">Tarefas pendentes</p>
          </div>
        </div>
      </div>

      {/* Gráfico receita + Funil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-gray-800">Receita vs Meta — Últimos 6 meses</h3>
            <div className="flex gap-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-0.5 bg-brand-500 rounded"></div> Realizado
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-0.5 bg-gray-300 rounded border-dashed"></div> Meta
              </span>
            </div>
          </div>
          {financials.revenueData?.some((d: any) => d.revenue > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financials.revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={fmtK} />
                  <Tooltip
                    formatter={(v: number) => [fmt(v)]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" name="Realizado" />
                  <Area type="monotone" dataKey="target" stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="5 5" fill="none" name="Meta" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-gray-400">
              <TrendingUp className="w-10 h-10 opacity-30" />
              <p className="text-sm">Nenhuma venda fechada ainda</p>
              <p className="text-xs">Dados aparecerão quando leads forem fechados</p>
            </div>
          )}
        </div>

        {/* Funil */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-5">Funil de Vendas</h3>
          {data?.funnel?.length > 0 ? (
            <div className="space-y-2">
              {data.funnel.slice(0, 7).map((stage: any, i: number) => {
                const maxCount = Math.max(...data.funnel.map((s: any) => s.count));
                const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span className="truncate max-w-[150px]">{stage.stage}</span>
                      <span className="font-semibold text-gray-700">{stage.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: stage.fill }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Sem dados de funil
            </div>
          )}
        </div>
      </div>

      {/* Admin: Origem leads + Tipos imóvel */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-500" /> Origem dos Leads
            </h3>
            {data?.leadSources?.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.leadSources} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                        {data.leadSources.map((e: any, i: number) => (
                          <Cell key={i} fill={e.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`${v}%`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  {data.leadSources.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                      <span className="text-gray-600 font-medium">{s.name}</span>
                      <span className="text-gray-400">({s.value}%)</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                Preencha o campo "origem" nos leads
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-500" /> Interesse por Tipo
            </h3>
            {data?.propertyTypes?.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.propertyTypes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {data.propertyTypes.map((e: any, i: number) => (
                        <Cell key={i} fill={e.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
                Preencha "interesse" nos leads
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin: Top agentes + Atividades */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Performance da Equipe
              </h3>
            </div>
            {data?.topAgents?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Corretor</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">VGV</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fechados</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Conversão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.topAgents.map((agent: any, i: number) => (
                      <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                          }`}>{i + 1}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
                              {agent.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{agent.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-700">{fmtK(agent.sales)}</td>
                        <td className="py-3 px-3">
                          <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">{agent.deals}</span>
                        </td>
                        <td className="py-3 px-3 text-gray-600 text-xs font-semibold">{agent.conversionRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
                Atribua leads a corretores para ver a performance
              </div>
            )}
          </div>

          {/* Feed de atividades */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" /> Atividade Recente
            </h3>
            {data?.activities?.length > 0 ? (
              <div className="space-y-4">
                {data.activities.slice(0, 6).map((a: any, i: number) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 leading-relaxed">
                        <span className="font-semibold">{a.target || 'Lead'}</span>
                        {' '}<span className="text-gray-500">{a.action}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{a.time} · {a.source || 'direto'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
                Nenhuma atividade ainda
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
