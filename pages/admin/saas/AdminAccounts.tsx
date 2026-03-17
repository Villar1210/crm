import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Search, Users } from 'lucide-react';
import {
  SaaSDeploymentType,
  SaaSAccountStatus,
  saasAccounts,
  saasModuleMap,
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

const AdminAccounts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SaaSAccountStatus | 'all'>('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [deploymentFilter, setDeploymentFilter] = useState<SaaSDeploymentType | 'all'>('all');

  const filteredAccounts = useMemo(() => {
    return saasAccounts.filter(account => {
      const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
      const matchesPlan = planFilter === 'all' || account.planId === planFilter;
      const matchesDeployment =
        deploymentFilter === 'all' || account.deploymentType === deploymentFilter;
      return matchesSearch && matchesStatus && matchesPlan && matchesDeployment;
    });
  }, [searchTerm, statusFilter, planFilter, deploymentFilter]);

  const planById = useMemo(() => {
    return saasPlans.reduce<Record<string, string>>((acc, plan) => {
      acc[plan.id] = plan.name;
      return acc;
    }, {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">
            Contas (Imobiliarias, Construtoras, Corretores)
          </h2>
          <p className="text-gray-500 text-sm">
            Controle geral de tenants, planos e modulos habilitados.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-4 py-2 text-sm font-semibold">
          <Users className="w-4 h-4" />
          {filteredAccounts.length} contas encontradas
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-[1.125rem] h-[1.125rem]" />
            <input
              type="text"
              placeholder="Buscar por nome da conta..."
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value as SaaSAccountStatus | 'all')}
                className="pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativas</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspensas</option>
                <option value="canceled">Canceladas</option>
              </select>
            </div>
            <select
              value={planFilter}
              onChange={event => setPlanFilter(event.target.value)}
              className="pl-3 pr-8 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Todos os planos</option>
              {saasPlans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
            <select
              value={deploymentFilter}
              onChange={event => setDeploymentFilter(event.target.value as SaaSDeploymentType | 'all')}
              className="pl-3 pr-8 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Todas as implantacoes</option>
              <option value="saas">SaaS</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Conta</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4">Implantacao</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Usuarios</th>
                <th className="px-6 py-4">Criada em</th>
                <th className="px-6 py-4">Modulos</th>
                <th className="px-6 py-4 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAccounts.map(account => {
                const status = statusLabels[account.status];
                const modulesPreview = account.modulesEnabled.slice(0, 3);
                const extraModules = account.modulesEnabled.length - modulesPreview.length;
                return (
                  <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{account.name}</p>
                        <p className="text-xs text-gray-400">{account.contactEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{typeLabels[account.type]}</td>
                    <td className="px-6 py-4 text-gray-700">{planById[account.planId]}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-semibold ${account.deploymentType === 'enterprise'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-slate-50 text-slate-700'
                          }`}
                      >
                        {account.deploymentType === 'enterprise' ? 'Enterprise' : 'SaaS'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${status.classes}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{account.usersCount}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(account.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {modulesPreview.map(moduleKey => (
                          <span
                            key={moduleKey}
                            className="px-2 py-1 rounded-full text-[0.6875rem] font-semibold bg-brand-50 text-brand-700"
                          >
                            {saasModuleMap[moduleKey]?.name ?? moduleKey}
                          </span>
                        ))}
                        {extraModules > 0 && (
                          <span className="px-2 py-1 rounded-full text-[0.6875rem] font-semibold bg-gray-100 text-gray-600">
                            +{extraModules}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/saas/contas/${account.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700"
                      >
                        Detalhes
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAccounts;
