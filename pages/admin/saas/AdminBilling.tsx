import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock3, CreditCard, DollarSign, Filter, XCircle } from 'lucide-react';
import {
  SaaSInvoice,
  SaaSInvoiceStatus,
  saasAccounts,
  saasInvoices,
  saasPlans
} from './adminSaasMockData';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const statusLabels: Record<SaaSInvoiceStatus, { label: string; classes: string }> = {
  pago: { label: 'Pago', classes: 'bg-emerald-50 text-emerald-700' },
  pendente: { label: 'Pendente', classes: 'bg-amber-50 text-amber-700' },
  vencido: { label: 'Vencido', classes: 'bg-red-50 text-red-600' },
  cancelado: { label: 'Cancelado', classes: 'bg-gray-100 text-gray-600' }
};

const AdminBilling: React.FC = () => {
  const [invoices, setInvoices] = useState<SaaSInvoice[]>([...saasInvoices]);
  const [statusFilter, setStatusFilter] = useState<SaaSInvoiceStatus | 'all'>('all');
  const [periodFilter, setPeriodFilter] = useState(30);

  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - periodFilter);

  const accountById = useMemo(() => {
    return saasAccounts.reduce<Record<string, string>>((acc, account) => {
      acc[account.id] = account.name;
      return acc;
    }, {});
  }, []);

  const planById = useMemo(() => {
    return saasPlans.reduce<Record<string, string>>((acc, plan) => {
      acc[plan.id] = plan.name;
      return acc;
    }, {});
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      const baseDate = invoice.paidAt ?? invoice.dueDate;
      const date = new Date(baseDate);
      const matchesPeriod = date >= startDate;
      return matchesStatus && matchesPeriod;
    });
  }, [invoices, statusFilter, startDate]);

  const monthlyRevenue = useMemo(() => {
    return invoices
      .filter(invoice => invoice.status === 'pago')
      .filter(invoice => {
        const baseDate = invoice.paidAt ?? invoice.dueDate;
        const date = new Date(baseDate);
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      })
      .reduce((sum, invoice) => sum + invoice.amount, 0);
  }, [invoices, now]);

  const pendingCount = invoices.filter(invoice => invoice.status === 'pendente').length;
  const overdueCount = invoices.filter(invoice => invoice.status === 'vencido').length;

  const logBillingEvent = (type: 'fatura_paga' | 'fatura_cancelada', invoice: SaaSInvoice) => {
    const event = {
      id: `evt-${Date.now()}`,
      type,
      accountId: invoice.accountId,
      timestamp: new Date().toISOString(),
      description: `Fatura ${invoice.id} ${type === 'fatura_paga' ? 'marcada como paga' : 'cancelada'}.`
    };
    console.log('SaaS event', event);
  };

  const handleMarkPaid = (invoice: SaaSInvoice) => {
    setInvoices(prev =>
      prev.map(item =>
        item.id === invoice.id
          ? { ...item, status: 'pago', paidAt: new Date().toISOString().split('T')[0] }
          : item
      )
    );
    logBillingEvent('fatura_paga', invoice);
  };

  const handleCancel = (invoice: SaaSInvoice) => {
    setInvoices(prev =>
      prev.map(item =>
        item.id === invoice.id ? { ...item, status: 'cancelado' } : item
      )
    );
    logBillingEvent('fatura_cancelada', invoice);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-bold text-gray-900">Billing e cobranca</h2>
        <p className="text-sm text-gray-500">
          Visao geral e controle de cobrancas por conta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Faturamento do mes</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(monthlyRevenue)}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <DollarSign className="w-[1.375rem] h-[1.375rem]" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Faturas pendentes</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{pendingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock3 className="w-[1.375rem] h-[1.375rem]" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Faturas vencidas</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{overdueCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle className="w-[1.375rem] h-[1.375rem]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-4">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600">
            <Filter className="w-4 h-4" />
            Filtros
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value as SaaSInvoiceStatus | 'all')}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700"
            >
              <option value="all">Todos os status</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="vencido">Vencido</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <select
              value={periodFilter}
              onChange={event => setPeriodFilter(Number(event.target.value))}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700"
            >
              <option value={30}>Ultimos 30 dias</option>
              <option value={90}>Ultimos 90 dias</option>
              <option value={180}>Ultimos 180 dias</option>
              <option value={365}>Ultimos 12 meses</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Conta</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Pago em</th>
                <th className="px-6 py-4 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map(invoice => {
                const badge = statusLabels[invoice.status];
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {accountById[invoice.accountId] ?? 'Conta'}
                      </p>
                      <p className="text-xs text-gray-400">{invoice.id}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{planById[invoice.planId]}</td>
                    <td className="px-6 py-4 text-gray-700">{formatCurrency(invoice.amount)}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-2">
                        {invoice.status !== 'pago' && invoice.status !== 'cancelado' && (
                          <button
                            onClick={() => handleMarkPaid(invoice)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Marcar pago
                          </button>
                        )}
                        {invoice.status !== 'cancelado' && (
                          <button
                            onClick={() => handleCancel(invoice)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Cancelar
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
    </div>
  );
};

export default AdminBilling;
