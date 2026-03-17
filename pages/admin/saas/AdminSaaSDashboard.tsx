import React, { useMemo } from 'react';
import {
  Activity,
  Ban,
  CheckCircle2,
  Clock,
  Crown,
  DollarSign,
  Layers3,
  Server,
  Users,
  XCircle
} from 'lucide-react';
import {
  saasAccountUsers,
  saasAccounts,
  saasEvents,
  saasInvoices,
  saasModules
} from './adminSaasMockData';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const AdminSaaSDashboard: React.FC = () => {
  const now = new Date();

  const activeCount = saasAccounts.filter(account => account.status === 'active').length;
  const trialCount = saasAccounts.filter(account => account.status === 'trial').length;
  const suspendedCount = saasAccounts.filter(account => account.status === 'suspended').length;
  const canceledCount = saasAccounts.filter(account => account.status === 'canceled').length;
  const saasCount = saasAccounts.filter(account => account.deploymentType === 'saas').length;
  const enterpriseCount = saasAccounts.filter(account => account.deploymentType === 'enterprise').length;
  const totalUsers = saasAccountUsers.filter(user => user.status === 'ativo').length;

  const monthlyRevenue = useMemo(() => {
    return saasInvoices
      .filter(invoice => invoice.status === 'pago')
      .filter(invoice => {
        const baseDate = invoice.paidAt ?? invoice.dueDate;
        const date = new Date(baseDate);
        return (
          date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
        );
      })
      .reduce((sum, invoice) => sum + invoice.amount, 0);
  }, [now]);

  const moduleUsage = useMemo(() => {
    return saasModules
      .map(module => ({
        ...module,
        accountsUsing: saasAccounts.filter(
          account => account.status === 'active' && account.modulesEnabled.includes(module.key)
        ).length
      }))
      .sort((a, b) => b.accountsUsing - a.accountsUsing);
  }, []);

  const eventTypeLabels = {
    conta_criada: 'Conta criada',
    plano_alterado: 'Plano alterado',
    modulo_ativado: 'Modulo ativado',
    modulo_desativado: 'Modulo desativado',
    conta_suspensa: 'Conta suspensa',
    conta_reativada: 'Conta reativada',
    conta_cancelada: 'Conta cancelada',
    fatura_paga: 'Fatura paga',
    fatura_cancelada: 'Fatura cancelada'
  } as const;

  const accountById = useMemo(() => {
    return saasAccounts.reduce<Record<string, string>>((acc, account) => {
      acc[account.id] = account.name;
      return acc;
    }, {});
  }, []);

  const recentEvents = useMemo(() => {
    return [...saasEvents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  }, []);

  const globalSettings = [
    { label: 'Nome do produto', value: 'Ivillar SaaS' },
    { label: 'Dominio principal', value: 'app.ivillar.com.br' },
    { label: 'Email de suporte', value: 'suporte@ivillar.com.br' },
    { label: 'Mensagem padrao', value: 'Seu trial termina em breve.' }
  ];

  const trialSettings = [
    { label: 'Trial padrao', value: '14 dias' },
    { label: 'Limite de usuarios', value: '5 usuarios' },
    { label: 'Limite de imoveis', value: '80 imoveis' },
    { label: 'Limite de WhatsApp', value: '2.000 disparos' }
  ];

  const kpis = [
    {
      label: 'Contas ativas',
      value: activeCount,
      icon: CheckCircle2,
      tone: 'text-emerald-600'
    },
    {
      label: 'Contas em trial',
      value: trialCount,
      icon: Clock,
      tone: 'text-amber-600'
    },
    {
      label: 'Contas suspensas',
      value: suspendedCount,
      icon: Ban,
      tone: 'text-red-500'
    },
    {
      label: 'Contas canceladas',
      value: canceledCount,
      icon: XCircle,
      tone: 'text-gray-500'
    },
    {
      label: 'Contas SaaS',
      value: saasCount,
      icon: Server,
      tone: 'text-slate-600'
    },
    {
      label: 'Contas Enterprise',
      value: enterpriseCount,
      icon: Crown,
      tone: 'text-purple-600'
    },
    {
      label: 'Usuarios ativos',
      value: totalUsers,
      icon: Users,
      tone: 'text-blue-600'
    },
    {
      label: 'Faturamento do mes',
      value: formatCurrency(monthlyRevenue),
      icon: DollarSign,
      tone: 'text-brand-600'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {kpi.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center ${kpi.tone}`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Layers3 className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-gray-800">Modulos mais usados</h3>
            </div>
            <span className="text-xs text-gray-400">Baseado em contas ativas</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {moduleUsage.map(module => (
              <div
                key={module.key}
                className="border border-gray-100 rounded-2xl p-4 bg-gray-50/60"
              >
                <p className="text-sm font-semibold text-gray-900">{module.name}</p>
                <p className="text-xs text-gray-500 mt-1">{module.description}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                  {module.accountsUsing} contas usando
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold text-gray-800">Eventos recentes</h3>
          </div>
          <div className="space-y-4">
            {recentEvents.map(event => (
              <div key={event.id} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">
                  {eventTypeLabels[event.type].slice(0, 1)}
                </div>
                <div>
                  <p className="text-sm text-gray-800 font-semibold">
                    {eventTypeLabels[event.type]}
                  </p>
                  <p className="text-xs text-gray-500">
                    {event.description} · {accountById[event.accountId] || 'Conta'}
                  </p>
                  <p className="text-[0.6875rem] text-gray-400 mt-1">
                    {new Date(event.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Configuracoes globais</h3>
          <div className="space-y-3 text-sm text-gray-600">
            {globalSettings.map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-semibold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Politica de trial</h3>
          <div className="space-y-3 text-sm text-gray-600">
            {trialSettings.map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-semibold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSaaSDashboard;
