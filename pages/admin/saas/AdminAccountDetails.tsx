import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  CreditCard,
  Globe,
  KeyRound,
  Mail,
  Power,
  Server,
  Shield,
  UserMinus,
  UserPlus
} from 'lucide-react';
import {
  SaaSAccount,
  SaaSAccountStatus,
  SaaSAccountUser,
  SaaSEvent,
  SaaSModuleKey,
  saasAccountUsers,
  saasAccounts,
  saasInvoices,
  saasModuleMap,
  saasModules,
  saasPlans
} from './adminSaasMockData';

const statusLabels: Record<SaaSAccountStatus, { label: string; classes: string }> = {
  active: { label: 'Ativa', classes: 'bg-emerald-50 text-emerald-700' },
  trial: { label: 'Trial', classes: 'bg-amber-50 text-amber-700' },
  suspended: { label: 'Suspensa', classes: 'bg-red-50 text-red-700' },
  canceled: { label: 'Cancelada', classes: 'bg-gray-100 text-gray-600' }
};

const typeLabels: Record<string, string> = {
  imobiliaria: 'Imobiliaria',
  construtora: 'Construtora',
  corretor: 'Corretor',
  outro: 'Outro'
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const AdminAccountDetails: React.FC = () => {
  const { id } = useParams();
  const [account, setAccount] = useState<SaaSAccount | null>(null);
  const [users, setUsers] = useState<SaaSAccountUser[]>([]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  useEffect(() => {
    const initialAccount = saasAccounts.find(item => item.id === id) ?? null;
    setAccount(initialAccount ? { ...initialAccount } : null);
    setUsers(saasAccountUsers.filter(user => user.accountId === id));
    setSelectedPlanId(initialAccount?.planId ?? '');
  }, [id]);

  const planById = useMemo(() => {
    return saasPlans.reduce<Record<string, string>>((acc, plan) => {
      acc[plan.id] = plan.name;
      return acc;
    }, {});
  }, []);

  const accountInvoices = useMemo(() => {
    return saasInvoices.filter(invoice => invoice.accountId === id);
  }, [id]);

  if (!account) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
        <p className="text-gray-500">Conta nao encontrada.</p>
        <Link
          to="/admin/saas/contas"
          className="inline-flex items-center gap-2 mt-4 text-brand-600 font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para contas
        </Link>
      </div>
    );
  }

  const currentPlan = saasPlans.find(plan => plan.id === account.planId);
  const status = statusLabels[account.status];

  const pushEvent = (type: SaaSEvent['type'], description: string) => {
    const newEvent: SaaSEvent = {
      id: `evt-${Date.now()}`,
      type,
      accountId: account.id,
      timestamp: new Date().toISOString(),
      description
    };
    console.log('SaaS event', newEvent);
  };

  const toggleModule = (moduleKey: SaaSModuleKey) => {
    const enabled = account.modulesEnabled.includes(moduleKey);
    const nextModules = enabled
      ? account.modulesEnabled.filter(item => item !== moduleKey)
      : [...account.modulesEnabled, moduleKey];
    setAccount({ ...account, modulesEnabled: nextModules });
    pushEvent(
      enabled ? 'modulo_desativado' : 'modulo_ativado',
      `Modulo ${saasModuleMap[moduleKey]?.name ?? moduleKey} ${enabled ? 'desativado' : 'ativado'
      } para a conta.`
    );
  };

  const updateStatus = (nextStatus: SaaSAccountStatus) => {
    setAccount({ ...account, status: nextStatus });
    if (nextStatus === 'suspended') {
      pushEvent('conta_suspensa', 'Conta bloqueada manualmente.');
    }
    if (nextStatus === 'active') {
      pushEvent('conta_reativada', 'Conta reativada manualmente.');
    }
    if (nextStatus === 'canceled') {
      pushEvent('conta_cancelada', 'Conta cancelada pelo admin.');
    }
  };

  const handlePlanSave = () => {
    if (!selectedPlanId || selectedPlanId === account.planId) {
      setIsPlanModalOpen(false);
      return;
    }
    const previousPlan = planById[account.planId];
    const nextPlan = planById[selectedPlanId];
    setAccount({ ...account, planId: selectedPlanId });
    pushEvent('plano_alterado', `Plano alterado de ${previousPlan} para ${nextPlan}.`);
    setIsPlanModalOpen(false);
  };

  const handleUserStatus = (userId: string, nextStatus: SaaSAccountUser['status']) => {
    setUsers(prev =>
      prev.map(user => (user.id === userId ? { ...user, status: nextStatus } : user))
    );
    console.log(`Usuario ${userId} atualizado para ${nextStatus}`);
  };

  const handleUserInvite = (userId: string) => {
    console.log(`Reenviar convite para ${userId}`);
  };

  return (
    <div className="space-y-6">
      <Link to="/admin/saas/contas" className="inline-flex items-center gap-2 text-sm text-gray-500">
        <ChevronLeft className="w-4 h-4" />
        Voltar para contas
      </Link>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-serif font-bold text-gray-900">{account.name}</h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-semibold ${account.deploymentType === 'enterprise'
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-slate-50 text-slate-700'
                    }`}
                >
                  {account.deploymentType === 'enterprise' ? 'Enterprise' : 'SaaS'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {typeLabels[account.type]} · {account.cnpjOrCpf ?? 'Documento nao informado'}
              </p>
            </div>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${status.classes}`}>
              {status.label}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-semibold text-gray-700">Contato</p>
                <p className="text-gray-500">{account.contactName}</p>
                <p className="text-gray-500">{account.contactEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-semibold text-gray-700">Plano atual</p>
                <p className="text-gray-500">{currentPlan?.name ?? 'Plano'}</p>
                <p className="text-gray-500">
                  {currentPlan ? formatCurrency(currentPlan.priceMonthly) : 'R$ 0'} / mes
                </p>
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Criada em</p>
              <p className="text-gray-500">
                {new Date(account.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Trial ate</p>
              <p className="text-gray-500">
                {account.trialEndsAt ? new Date(account.trialEndsAt).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-80 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Acoes rapidas</h3>
          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="w-full px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
          >
            Trocar plano
          </button>
          <button
            onClick={() => console.log('Impersonate', account.id)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Entrar na conta
          </button>
          <button
            onClick={() => updateStatus('suspended')}
            className="w-full px-4 py-2 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Bloquear acesso
          </button>
          <button
            onClick={() => updateStatus('active')}
            className="w-full px-4 py-2 rounded-xl border border-emerald-200 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
          >
            Reativar conta
          </button>
          <button
            onClick={() => updateStatus('canceled')}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancelar conta
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-[1.125rem] h-[1.125rem] text-brand-600" />
          <h3 className="font-semibold text-gray-800">Tipo de implantacao</h3>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Tipo</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-semibold ${account.deploymentType === 'enterprise'
                ? 'bg-purple-50 text-purple-700'
                : 'bg-slate-50 text-slate-700'
                }`}
            >
              {account.deploymentType === 'enterprise' ? 'Enterprise' : 'SaaS'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Dominio personalizado</span>
            <span className="inline-flex items-center gap-2 font-semibold text-gray-700">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              {account.customDomain ?? '-'}
            </span>
          </div>
          <div>
            <p className="text-gray-500">White label</p>
            <p className="text-gray-700 font-semibold">
              {account.isWhiteLabel
                ? 'White label ativo (sem marca IVILAR para o cliente).'
                : 'White label desativado.'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Notas internas</p>
            <p className="text-gray-700">{account.notes ?? 'Sem observacoes internas.'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Modulos da conta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {saasModules.map(module => {
            const enabled = account.modulesEnabled.includes(module.key);
            return (
              <div
                key={module.key}
                className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">{module.name}</p>
                  <p className="text-xs text-gray-500">{module.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleModule(module.key)}
                  className={`w-12 h-7 rounded-full flex items-center transition-colors ${enabled ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}
                  aria-pressed={enabled}
                >
                  <span
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  ></span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Usuarios da conta</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => {
                const badge =
                  user.status === 'ativo'
                    ? 'bg-emerald-50 text-emerald-700'
                    : user.status === 'suspenso'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-amber-50 text-amber-700';
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-gray-600">{user.role}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${badge}`}>
                        {user.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-2">
                        {(user.status === 'ativo' || user.status === 'suspenso') && (
                          <button
                            onClick={() => console.log('Reset senha', user.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            Reset senha
                          </button>
                        )}
                        {user.status === 'ativo' && (
                          <button
                            onClick={() => handleUserStatus(user.id, 'suspenso')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            Suspender
                          </button>
                        )}
                        {user.status === 'suspenso' && (
                          <button
                            onClick={() => handleUserStatus(user.id, 'ativo')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Ativar
                          </button>
                        )}
                        {user.status === 'convite_pendente' && (
                          <button
                            onClick={() => handleUserInvite(user.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            Reenviar convite
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Billing da conta</h3>
            <p className="text-xs text-gray-500">
              Plano {currentPlan?.name ?? '-'} · Ciclo mensal
            </p>
          </div>
          <button
            onClick={() => console.log('Reset password', account.id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <Power className="w-3.5 h-3.5" />
            Reset de senha
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Fatura</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Pago em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accountInvoices.map(invoice => {
                const badge =
                  invoice.status === 'pago'
                    ? 'bg-emerald-50 text-emerald-700'
                    : invoice.status === 'pendente'
                      ? 'bg-amber-50 text-amber-700'
                      : invoice.status === 'vencido'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-600';
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{invoice.id}</td>
                    <td className="px-6 py-4 text-gray-700">{formatCurrency(invoice.amount)}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${badge}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('pt-BR') : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900">Trocar plano</h3>
            <p className="text-sm text-gray-500 mt-1">
              Escolha o novo plano para esta conta.
            </p>
            <div className="mt-4 space-y-3">
              <select
                value={selectedPlanId}
                onChange={event => setSelectedPlanId(event.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700"
              >
                {saasPlans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} · {formatCurrency(plan.priceMonthly)} / mes
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handlePlanSave}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccountDetails;
