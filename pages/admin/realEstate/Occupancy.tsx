import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Plus, Search, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RealEstateOccupancyItem, realEstateOccupancy } from './mockData';

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500';
const labelClass = 'text-xs font-medium text-slate-500';
const ghostButtonClass =
  'inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-slate-50 transition';
const primaryButtonClass =
  'inline-flex items-center gap-2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 transition';
const modalPrimaryButtonClass =
  'rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition';
const modalSecondaryButtonClass =
  'rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-slate-50 transition';

const statusOptions: RealEstateOccupancyItem['status'][] = ['ocupado', 'vago', 'reservado'];

const initialForm = {
  development: '',
  block: '',
  unit: '',
  status: 'vago' as RealEstateOccupancyItem['status'],
  tenant: '',
  owner: ''
};

const RealEstateOccupancy: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [occupancyItems, setOccupancyItems] = useState<RealEstateOccupancyItem[]>(() => realEstateOccupancy);
  const [developmentFilter, setDevelopmentFilter] = useState('all');
  const [blockFilter, setBlockFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | RealEstateOccupancyItem['status']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const developments = useMemo(() => {
    const unique = new Set(occupancyItems.map(item => item.development));
    return ['all', ...Array.from(unique)];
  }, [occupancyItems]);

  const blocks = useMemo(() => {
    const unique = new Set(occupancyItems.map(item => item.block));
    return ['all', ...Array.from(unique)];
  }, [occupancyItems]);

  const filtered = occupancyItems.filter(item => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.development.toLowerCase().includes(query) ||
      item.block.toLowerCase().includes(query) ||
      item.unit.toLowerCase().includes(query) ||
      item.tenant.toLowerCase().includes(query) ||
      item.owner.toLowerCase().includes(query);
    const devMatch = developmentFilter === 'all' || item.development === developmentFilter;
    const blockMatch = blockFilter === 'all' || item.block === blockFilter;
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && devMatch && blockMatch && statusMatch;
  });

  const clearFilters = () => {
    setDevelopmentFilter('all');
    setBlockFilter('all');
    setStatusFilter('all');
    setSearchTerm('');
  };

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newItem: RealEstateOccupancyItem = {
      id: `occ-${Date.now()}`,
      development: formData.development || 'Nao informado',
      block: formData.block || '-',
      unit: formData.unit || '-',
      status: formData.status,
      tenant: formData.tenant || '-',
      owner: formData.owner || '-'
    };
    setOccupancyItems(prev => [newItem, ...prev]);
    setFormData(initialForm);
    setShowNewModal(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpenNew = params.get('novo') === '1';
    if (shouldOpenNew) {
      setShowNewModal(true);
      params.delete('novo');
      const nextSearch = params.toString();
      navigate(nextSearch ? `${location.pathname}?${nextSearch}` : location.pathname, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Ocupacao</h3>
        <p className="text-sm text-gray-500">Mapa de unidades ocupadas, vagas e reservadas.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter className="w-4 h-4" />
            Filtros
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={clearFilters} className={ghostButtonClass}>
              Limpar filtros
            </button>
            <button type="button" onClick={() => setShowNewModal(true)} className={primaryButtonClass}>
              <Plus className="w-3.5 h-3.5" />
              Atualizar unidade
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-[1.125rem] h-[1.125rem]" />
            <input
              type="text"
              placeholder="Buscar por empreendimento, bloco ou unidade"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={developmentFilter}
            onChange={event => setDevelopmentFilter(event.target.value)}
            className={inputClass}
          >
            {developments.map(dev => (
              <option key={dev} value={dev}>
                {dev === 'all' ? 'Empreendimento (todos)' : dev}
              </option>
            ))}
          </select>
          <select
            value={blockFilter}
            onChange={event => setBlockFilter(event.target.value)}
            className={inputClass}
          >
            {blocks.map(block => (
              <option key={block} value={block}>
                {block === 'all' ? 'Bloco (todos)' : block}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value as RealEstateOccupancyItem['status'] | 'all')}
            className={inputClass}
          >
            <option value="all">Situacao (todas)</option>
            {statusOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 text-xs text-gray-500">{filtered.length} unidades encontradas</div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wide text-[0.6875rem]">
              <tr>
                <th className="px-4 py-3">Empreendimento</th>
                <th className="px-4 py-3">Bloco</th>
                <th className="px-4 py-3">Unidade</th>
                <th className="px-4 py-3">Situacao</th>
                <th className="px-4 py-3">Inquilino</th>
                <th className="px-4 py-3">Proprietario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900">{item.development}</td>
                  <td className="px-4 py-3 text-gray-700">{item.block}</td>
                  <td className="px-4 py-3 text-gray-700">{item.unit}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold ${
                        item.status === 'ocupado'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.status === 'vago'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{item.tenant}</td>
                  <td className="px-4 py-3 text-gray-700">{item.owner}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Nenhuma unidade encontrada com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-xl border border-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Atualizar unidade</h4>
                <p className="text-xs text-gray-500">Registre uma nova unidade ou status.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Empreendimento</label>
                  <input
                    className={inputClass}
                    value={formData.development}
                    onChange={event => setFormData(prev => ({ ...prev, development: event.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Bloco</label>
                  <input
                    className={inputClass}
                    value={formData.block}
                    onChange={event => setFormData(prev => ({ ...prev, block: event.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Unidade</label>
                  <input
                    className={inputClass}
                    value={formData.unit}
                    onChange={event => setFormData(prev => ({ ...prev, unit: event.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Situacao</label>
                  <select
                    className={inputClass}
                    value={formData.status}
                    onChange={event =>
                      setFormData(prev => ({ ...prev, status: event.target.value as RealEstateOccupancyItem['status'] }))
                    }
                  >
                    {statusOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Inquilino</label>
                  <input
                    className={inputClass}
                    value={formData.tenant}
                    onChange={event => setFormData(prev => ({ ...prev, tenant: event.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Proprietario</label>
                  <input
                    className={inputClass}
                    value={formData.owner}
                    onChange={event => setFormData(prev => ({ ...prev, owner: event.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNewModal(false)} className={modalSecondaryButtonClass}>
                  Cancelar
                </button>
                <button type="submit" className={modalPrimaryButtonClass}>
                  Salvar unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealEstateOccupancy;
