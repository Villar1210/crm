import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const RealEstateDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    occupiedProperties: 0,
    vacantProperties: 0,
    occupancyRate: 0,
    receivableMonth: 0,
    payableOwners: 0,
    lateTenants: 0
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [props, contracts, invoices, payouts] = await Promise.all([
          api.properties.getAll(),
          api.realEstate.contracts.list(),
          api.realEstate.finance.listInvoices(),
          api.realEstate.finance.listPayouts()
        ]);

        const totalProperties = props.length;
        // Assuming active contracts imply occupancy
        const activeContracts = contracts.filter((c: any) => c.status === 'active');

        // Note: One property might have multiple contracts? Usually 1 active. 
        // Ideally we check distinct propertyIds in active contracts.
        const occupiedPropertyIds = new Set(activeContracts.map((c: any) => c.propertyId));
        const occupiedProperties = occupiedPropertyIds.size;
        const vacantProperties = Math.max(0, totalProperties - occupiedProperties);
        const occupancyRate = totalProperties > 0 ? ((occupiedProperties / totalProperties) * 100).toFixed(1) : 0;

        // Financials (Total of all fetched Invoice/Payouts or just this month?)
        // For dashboard "Total a receber NO MES", we should filter by current month.
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // e.g. 2024-05
        // Backend format for invoice.referenceMonth is ISO Date or similar.

        const receivableMonth = invoices
          .filter((inv: any) => inv.referenceMonth && inv.referenceMonth.startsWith(currentMonthStr))
          .reduce((acc: number, curr: any) => acc + curr.amountTotal, 0);

        const payableOwners = payouts
          .filter((p: any) => p.referenceMonth && p.referenceMonth.startsWith(currentMonthStr))
          .reduce((acc: number, curr: any) => acc + curr.amount, 0);

        // Late tenants: Invoices with status 'overdue' (or 'em atraso' if mapped)
        // Backend might use 'overdue'.
        const lateTenants = invoices.filter((inv: any) => inv.status === 'overdue' || inv.status === 'atrasado').length;

        setStats({
          totalProperties,
          occupiedProperties,
          vacantProperties,
          occupancyRate: Number(occupancyRate),
          receivableMonth,
          payableOwners,
          lateTenants
        });

      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      }
    }
    loadStats();
  }, []);

  const kpiCards = [
    { label: 'Total de imóveis cadastrados', value: stats.totalProperties.toString() },
    { label: 'Imóveis ocupados', value: stats.occupiedProperties.toString() },
    { label: 'Imóveis vagos', value: stats.vacantProperties.toString() },
    { label: 'Ocupação %', value: `${stats.occupancyRate}%` },
    { label: 'Inquilinos em atraso', value: stats.lateTenants.toString() },
    { label: 'Total a receber no mês', value: formatCurrency(stats.receivableMonth) },
    { label: 'Total a repassar a proprietários', value: formatCurrency(stats.payableOwners) }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <div key={card.label} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="text-xl font-semibold text-gray-900 mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder for charts until we have historical data */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center text-gray-400">
        <p>Graficos e historicos estarao disponiveis apos movimentacao financeira.</p>
      </div>
    </div>
  );
};

export default RealEstateDashboard;
