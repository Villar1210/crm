import React, { useMemo, useState } from 'react';
import { BarChart2, Filter } from 'lucide-react';
import { getRealEstateProperties } from './mockData';

const RealEstatePropertyReports: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'ocupado' | 'vago' | 'reservado'>('all');
  const [purposeFilter, setPurposeFilter] = useState<'all' | 'locacao' | 'venda' | 'ambos'>('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const properties = useMemo(() => getRealEstateProperties(), []);

  const owners = useMemo(() => {
    const unique = new Set(properties.map(item => item.owner));
    return ['all', ...Array.from(unique)];
  }, [properties]);

  const types = useMemo(() => {
    const unique = new Set(properties.map(item => item.type));
    return ['all', ...Array.from(unique)];
  }, [properties]);

  const filtered = useMemo(() => {
    return properties.filter(property => {
      const statusMatch = statusFilter === 'all' || property.status === statusFilter;
      const purposeMatch = purposeFilter === 'all' || property.purpose === purposeFilter;
      const ownerMatch = ownerFilter === 'all' || property.owner === ownerFilter;
      const typeMatch = typeFilter === 'all' || property.type === typeFilter;
      return statusMatch && purposeMatch && ownerMatch && typeMatch;
    });
  }, [properties, statusFilter, purposeFilter, ownerFilter, typeFilter]);

  const totals = useMemo(() => {
    const total = filtered.length;
    const occupied = filtered.filter(property => property.status === 'ocupado').length;
    const vacant = filtered.filter(property => property.status === 'vago').length;
    const reserved = filtered.filter(property => property.status === 'reservado').length;
    const late = filtered.filter(property => property.financeStatus === 'atrasado').length;
    const totalRent = filtered.reduce((sum, property) => sum + property.rent, 0);
    const avgRent = total ? totalRent / total : 0;
    const occupancyRate = total ? Math.round((occupied / total) * 100) : 0;
    return {
      total,
      occupied,
      vacant,
      reserved,
      late,
      totalRent,
      avgRent,
      occupancyRate
    };
  }, [filtered]);

  const byType = useMemo(() => {
    const map = new Map<string, { type: string; total: number; occupied: number; vacant: number; reserved: number; totalRent: number }>();
    filtered.forEach(property => {
      const current = map.get(property.type) ?? {
        type: property.type,
        total: 0,
        occupied: 0,
        vacant: 0,
        reserved: 0,
        totalRent: 0
      };
      current.total += 1;
      current.totalRent += property.rent;
      if (property.status === 'ocupado') current.occupied += 1;
      if (property.status === 'vago') current.vacant += 1;
      if (property.status === 'reservado') current.reserved += 1;
      map.set(property.type, current);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const byOwner = useMemo(() => {
    const map = new Map<string, { owner: string; total: number; occupied: number; totalRent: number }>();
    filtered.forEach(property => {
      const current = map.get(property.owner) ?? {
        owner: property.owner,
        total: 0,
        occupied: 0,
        totalRent: 0
      };
      current.total += 1;
      current.totalRent += property.rent;
      if (property.status === 'ocupado') current.occupied += 1;
      map.set(property.owner, current);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Relatorios de imoveis</h3>
        <p className="text-sm text-gray-500">
          Indicadores de ocupacao, tipos e performance financeira dos imoveis.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <Filter className="w-4 h-4" />
          Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
          >
            <option value="all">Situacao (todas)</option>
            <option value="ocupado">Ocupado</option>
            <option value="vago">Vago</option>
            <option value="reservado">Reservado</option>
          </select>
          <select
            value={purposeFilter}
            onChange={event => setPurposeFilter(event.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
          >
            <option value="all">Finalidade (todas)</option>
            <option value="locacao">Locacao</option>
            <option value="venda">Venda</option>
            <option value="ambos">Ambos</option>
          </select>
          <select
            value={typeFilter}
            onChange={event => setTypeFilter(event.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
          >
            {types.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'Tipo (todos)' : type}
              </option>
            ))}
          </select>
          <select
            value={ownerFilter}
            onChange={event => setOwnerFilter(event.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
          >
            {owners.map(owner => (
              <option key={owner} value={owner}>
                {owner === 'all' ? 'Proprietario (todos)' : owner}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs text-gray-500">Total de imoveis</p>
          <p className="text-2xl font-semibold text-gray-900">{totals.total}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs text-gray-500">Ocupados</p>
          <p className="text-2xl font-semibold text-gray-900">{totals.occupied}</p>
          <p className="text-[0.6875rem] text-emerald-600">{totals.occupancyRate}% de ocupacao</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs text-gray-500">Vagos</p>
          <p className="text-2xl font-semibold text-gray-900">{totals.vacant}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs text-gray-500">Reservados</p>
          <p className="text-2xl font-semibold text-gray-900">{totals.reserved}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs text-gray-500">Ticket medio aluguel</p>
          <p className="text-2xl font-semibold text-gray-900">
            {totals.avgRent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <BarChart2 className="w-4 h-4 text-brand-600" />
            <h4 className="text-sm font-semibold text-gray-900">Resumo por tipo</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wide text-[0.6875rem]">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Ocupados</th>
                  <th className="px-4 py-3">Vagos</th>
                  <th className="px-4 py-3">Reservados</th>
                  <th className="px-4 py-3">Valor medio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {byType.map(item => (
                  <tr key={item.type}>
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.type}</td>
                    <td className="px-4 py-3 text-gray-700">{item.total}</td>
                    <td className="px-4 py-3 text-gray-700">{item.occupied}</td>
                    <td className="px-4 py-3 text-gray-700">{item.vacant}</td>
                    <td className="px-4 py-3 text-gray-700">{item.reserved}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {(item.totalRent / Math.max(item.total, 1)).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </td>
                  </tr>
                ))}
                {byType.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                      Nenhum dado encontrado para os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <BarChart2 className="w-4 h-4 text-brand-600" />
            <h4 className="text-sm font-semibold text-gray-900">Resumo por proprietario</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wide text-[0.6875rem]">
                <tr>
                  <th className="px-4 py-3">Proprietario</th>
                  <th className="px-4 py-3">Imoveis</th>
                  <th className="px-4 py-3">Ocupados</th>
                  <th className="px-4 py-3">Valor total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {byOwner.map(item => (
                  <tr key={item.owner}>
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.owner}</td>
                    <td className="px-4 py-3 text-gray-700">{item.total}</td>
                    <td className="px-4 py-3 text-gray-700">{item.occupied}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.totalRent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                ))}
                {byOwner.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                      Nenhum dado encontrado para os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Imoveis com status financeiro atrasado</p>
          <p className="text-lg font-semibold text-gray-900">{totals.late}</p>
        </div>
        <p className="text-xs text-gray-500">Detalhes completos em breve.</p>
        {/* TODO: integrar dados detalhados de inadimplencia e historico financeiro. */}
      </div>
    </div>
  );
};

export default RealEstatePropertyReports;
