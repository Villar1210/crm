import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckSquare, Filter, LayoutGrid, List, MapPin, Search, Tag, Upload, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRealEstateProperties, RealEstateProperty } from './mockData';

const RealEstateProperties: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [properties] = useState<RealEstateProperty[]>(() => getRealEstateProperties());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ocupado' | 'vago' | 'reservado'>('all');
  const [purposeFilter, setPurposeFilter] = useState<'all' | 'locacao' | 'venda' | 'ambos'>('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [financeFilter, setFinanceFilter] = useState<'all' | 'em dia' | 'atrasado'>('all');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'map'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [propertyTags, setPropertyTags] = useState<Record<string, string[]>>({
    're-001': ['Premium', 'Vista', 'Mobiliado'],
    're-002': ['Familia', 'Quintal'],
    're-003': ['Comercial', 'Alta demanda'],
    're-004': ['Jovem', 'Studio'],
    're-005': ['Luxo', 'Cobertura'],
    're-006': ['Acessivel'],
    're-007': ['Compacto'],
    're-008': ['Comercial', 'Centro']
  });

  const owners = useMemo(() => {
    const unique = new Set(properties.map(item => item.owner));
    return ['all', ...Array.from(unique)];
  }, [properties]);

  const types = useMemo(() => {
    const unique = new Set(properties.map(item => item.type));
    return ['all', ...Array.from(unique)];
  }, [properties]);

  const tagOptions = useMemo(() => {
    const unique = new Set(Object.values(propertyTags).flat());
    return ['all', ...Array.from(unique)];
  }, [propertyTags]);

  const auditInfo = useMemo(() => {
    const reviewers = ['Time de Cadastro', 'Equipe de Operacoes', 'Suporte'];
    return properties.reduce((acc, property, index) => {
      acc[property.id] = {
        updatedAt: `ha ${index + 1} dias`,
        updatedBy: reviewers[index % reviewers.length]
      };
      return acc;
    }, {} as Record<string, { updatedAt: string; updatedBy: string }>);
  }, [properties]);

  const filtered = useMemo(() => {
    const minValue = minRent.trim() ? Number(minRent) : null;
    const maxValue = maxRent.trim() ? Number(maxRent) : null;

    return properties.filter(property => {
      const searchMatch =
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || property.status === statusFilter;
      const purposeMatch = purposeFilter === 'all' || property.purpose === purposeFilter;
      const ownerMatch = ownerFilter === 'all' || property.owner === ownerFilter;
      const typeMatch = typeFilter === 'all' || property.type === typeFilter;
      const financeMatch = financeFilter === 'all' || property.financeStatus === financeFilter;
      const minMatch = minValue === null || Number.isNaN(minValue) || property.rent >= minValue;
      const maxMatch = maxValue === null || Number.isNaN(maxValue) || property.rent <= maxValue;
      const tags = propertyTags[property.id] ?? [];
      const tagMatch = tagFilter === 'all' || tags.includes(tagFilter);
      return (
        searchMatch &&
        statusMatch &&
        purposeMatch &&
        ownerMatch &&
        typeMatch &&
        financeMatch &&
        minMatch &&
        maxMatch &&
        tagMatch
      );
    });
  }, [
    properties,
    searchTerm,
    statusFilter,
    purposeFilter,
    ownerFilter,
    typeFilter,
    financeFilter,
    minRent,
    maxRent,
    tagFilter,
    propertyTags
  ]);

  const allSelected = filtered.length > 0 && filtered.every(property => selectedIds.includes(property.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(filtered.map(property => property.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (action: string) => {
    console.log(`ACAO EM MASSA: ${action}`, selectedIds);
    // TODO: integrar acao em massa com backend.
    setSelectedIds([]);
  };

  const handleAddTag = (propertyId: string) => {
    const nextTag = window.prompt('Nova tag para este imovel');
    if (!nextTag) {
      return;
    }
    setPropertyTags(prev => ({
      ...prev,
      [propertyId]: [...(prev[propertyId] ?? []), nextTag]
    }));
    // TODO: integrar tags com backend.
  };

  const handleExport = useCallback(() => {
    const header = [
      'ID',
      'Imovel',
      'Endereco',
      'Tipo',
      'Proprietario',
      'Situacao',
      'Finalidade',
      'Valor',
      'Status financeiro'
    ];

    const formatValue = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

    const rows = filtered.map(property => [
      property.id,
      property.title,
      property.address,
      property.type,
      property.owner,
      property.status,
      property.purpose,
      property.rent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      property.financeStatus
    ]);

    const csv = [header, ...rows]
      .map(row => row.map(formatValue).join(';'))
      .join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `imoveis-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    // TODO: integrar exportacao com backend.
  }, [filtered]);

  const handleImport = () => {
    console.log('IMPORTAR IMOVEIS', importFileName);
    // TODO: integrar importacao com backend.
    setShowImportModal(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPurposeFilter('all');
    setOwnerFilter('all');
    setTypeFilter('all');
    setFinanceFilter('all');
    setMinRent('');
    setMaxRent('');
    setTagFilter('all');
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpenImport = params.get('importar') === '1';
    const shouldExport = params.get('exportar') === '1';

    if (shouldOpenImport) {
      setShowImportModal(true);
    }

    if (shouldExport) {
      handleExport();
    }

    if (shouldOpenImport || shouldExport) {
      params.delete('importar');
      params.delete('exportar');
      const nextSearch = params.toString();
      navigate(nextSearch ? `${location.pathname}?${nextSearch}` : location.pathname, { replace: true });
    }
  }, [handleExport, location.pathname, location.search, navigate]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Imoveis</h3>
        <p className="text-sm text-gray-500">Controle de imoveis da gestao imobiliaria.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter className="w-4 h-4" />
            Filtros rapidos
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(prev => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-slate-50 transition"
            >
              {showAdvancedFilters ? 'Ocultar avancados' : 'Filtros avancados'}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-slate-50 transition"
            >
              Limpar filtros
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-[1.125rem] h-[1.125rem]" />
            <input
              type="text"
              placeholder="Buscar por titulo ou endereco"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
          >
            <option value="all">Situacao (todas)</option>
            <option value="ocupado">Ocupado</option>
            <option value="vago">Vago</option>
            <option value="reservado">Reservado</option>
          </select>
          <select
            value={purposeFilter}
            onChange={e => setPurposeFilter(e.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
          >
            <option value="all">Finalidade (todas)</option>
            <option value="locacao">Locacao</option>
            <option value="venda">Venda</option>
            <option value="ambos">Ambos</option>
          </select>
          <select
            value={ownerFilter}
            onChange={e => setOwnerFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm lg:col-span-4"
          >
            {owners.map(owner => (
              <option key={owner} value={owner}>
                {owner === 'all' ? 'Proprietario (todos)' : owner}
              </option>
            ))}
          </select>
        </div>
        {showAdvancedFilters && (
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-4 gap-3">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            >
              {types.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'Tipo (todos)' : type}
                </option>
              ))}
            </select>
            <select
              value={financeFilter}
              onChange={e => setFinanceFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            >
              <option value="all">Status financeiro (todos)</option>
              <option value="em dia">Em dia</option>
              <option value="atrasado">Atrasado</option>
            </select>
            <input
              type="number"
              placeholder="Valor minimo"
              value={minRent}
              onChange={e => setMinRent(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
            <input
              type="number"
              placeholder="Valor maximo"
              value={maxRent}
              onChange={e => setMaxRent(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
            <select
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm lg:col-span-4"
            >
              {tagOptions.map(tag => (
                <option key={tag} value={tag}>
                  {tag === 'all' ? 'Tags (todas)' : tag}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-full bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                }`}
            >
              <List className="w-3.5 h-3.5" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${viewMode === 'cards' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${viewMode === 'map' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Mapa
            </button>
          </div>
          <div className="text-xs text-gray-500">
            {filtered.length} imoveis encontrados
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <CheckSquare className="w-4 h-4" />
            {selectedIds.length} imoveis selecionados
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkAction('marcar_ocupado')}
              className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
            >
              Marcar ocupado
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('marcar_vago')}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Marcar vago
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('marcar_reservado')}
              className="rounded-full border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition"
            >
              Marcar reservado
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('exportar')}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Exportar selecionados
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
            >
              Limpar selecao
            </button>
          </div>
        </div>
      )}

      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wide text-[0.6875rem]">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  <th className="px-4 py-3">Imovel</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Proprietario</th>
                  <th className="px-4 py-3">Situacao</th>
                  <th className="px-4 py-3">Finalidade</th>
                  <th className="px-4 py-3">Valor principal</th>
                  <th className="px-4 py-3">Status financeiro</th>
                  <th className="px-4 py-3">Tags</th>
                  <th className="px-4 py-3">Atualizacao</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(property => {
                  const tags = propertyTags[property.id] ?? [];
                  const audit = auditInfo[property.id];
                  return (
                    <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(property.id)}
                          onChange={() => toggleSelect(property.id)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-900">{property.title}</p>
                          <p className="text-xs text-gray-500">{property.address}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{property.type}</td>
                      <td className="px-4 py-3 text-gray-700">{property.owner}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold ${property.status === 'ocupado'
                            ? 'bg-emerald-50 text-emerald-700'
                            : property.status === 'vago'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-50 text-amber-700'
                            }`}
                        >
                          {property.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {property.purpose === 'locacao' ? 'Locacao' : property.purpose === 'venda' ? 'Venda' : 'Ambos'}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {property.rent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold ${property.financeStatus === 'em dia'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                            }`}
                        >
                          {property.financeStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {tags.map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.625rem] font-semibold text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddTag(property.id)}
                            className="inline-flex items-center gap-1 text-[0.625rem] font-semibold text-brand-600 hover:text-brand-700"
                          >
                            <Tag className="w-3 h-3" />
                            Tag
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <div>{audit?.updatedAt ?? '-'}</div>
                        <div className="text-[0.625rem] text-gray-400">{audit?.updatedBy ?? ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">Contratos</button>
                          <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Financeiro</button>
                          <button className="text-xs font-semibold text-gray-600 hover:text-gray-800">Detalhes</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-6 text-center text-sm text-gray-500">
                      Nenhum imovel encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(property => {
            const tags = propertyTags[property.id] ?? [];
            const audit = auditInfo[property.id];
            return (
              <div key={property.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{property.title}</p>
                    <p className="text-xs text-gray-500">{property.address}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(property.id)}
                    onChange={() => toggleSelect(property.id)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span className="rounded-full bg-slate-100 px-2 py-1">{property.type}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">{property.owner}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold ${property.status === 'ocupado'
                      ? 'bg-emerald-50 text-emerald-700'
                      : property.status === 'vago'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-50 text-amber-700'
                      }`}
                  >
                    {property.status}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold ${property.financeStatus === 'em dia'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                      }`}
                  >
                    {property.financeStatus}
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {property.rent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  <span className="text-xs font-medium text-gray-500"> / mes</span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.625rem] font-semibold text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddTag(property.id)}
                    className="inline-flex items-center gap-1 text-[0.625rem] font-semibold text-brand-600 hover:text-brand-700"
                  >
                    <Tag className="w-3 h-3" />
                    Tag
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Atualizado {audit?.updatedAt ?? '-'} por {audit?.updatedBy ?? '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">Contratos</button>
                  <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Financeiro</button>
                  <button className="text-xs font-semibold text-gray-600 hover:text-gray-800">Detalhes</button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full bg-white rounded-3xl shadow-sm border border-slate-100 p-6 text-center text-sm text-gray-500">
              Nenhum imovel encontrado com os filtros atuais.
            </div>
          )}
        </div>
      )}

      {viewMode === 'map' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Mapa de imoveis</h4>
              <p className="text-xs text-gray-500">Visualizacao geografica com status em tempo real.</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-slate-50 transition"
            >
              Configurar mapa
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            <div className="h-72 rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-400">
              Mapa interativo em breve
            </div>
            <div className="space-y-2">
              {filtered.map(property => (
                <div key={property.id} className="rounded-2xl border border-slate-100 bg-white px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{property.title}</p>
                    <p className="text-[0.6875rem] text-gray-500">{property.address}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.625rem] font-semibold ${property.status === 'ocupado'
                      ? 'bg-emerald-50 text-emerald-700'
                      : property.status === 'vago'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-50 text-amber-700'
                      }`}
                  >
                    {property.status}
                  </span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="rounded-2xl border border-slate-100 bg-white px-3 py-6 text-center text-xs text-gray-500">
                  Nenhum imovel disponivel para o mapa.
                </div>
              )}
            </div>
          </div>
          {/* TODO: integrar mapa (Google Maps/Mapbox) com coordenadas dos imoveis. */}
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-xl border border-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Importar imoveis</h4>
                <p className="text-xs text-gray-500">Envie um arquivo CSV para cadastro em lote.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-gray-500">
              <p>Arraste o arquivo aqui ou clique para selecionar.</p>
              <label className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-white transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Selecionar arquivo
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    setImportFileName(file ? file.name : '');
                  }}
                />
              </label>
              {importFileName && (
                <p className="mt-2 text-xs text-gray-600">Arquivo: {importFileName}</p>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Baixe o template padrao para evitar erros.</span>
              <button
                type="button"
                onClick={() => console.log('DOWNLOAD TEMPLATE CSV')}
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                Baixar template
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition"
              >
                Importar imoveis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealEstateProperties;
