import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Plus, Search, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RealEstateDocument, realEstateDocuments } from './mockData';

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

const initialForm = {
  name: '',
  docType: '',
  relatedTo: '',
  uploadedAt: ''
};

const RealEstateDocuments: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [documents, setDocuments] = useState<RealEstateDocument[]>(() => realEstateDocuments);
  const [typeFilter, setTypeFilter] = useState('all');
  const [relatedFilter, setRelatedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const types = useMemo(() => {
    const unique = new Set(documents.map(doc => doc.docType));
    return ['all', ...Array.from(unique)];
  }, [documents]);

  const related = useMemo(() => {
    const unique = new Set(documents.map(doc => doc.relatedTo));
    return ['all', ...Array.from(unique)];
  }, [documents]);

  const filtered = documents.filter(doc => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      doc.name.toLowerCase().includes(query) ||
      doc.docType.toLowerCase().includes(query) ||
      doc.relatedTo.toLowerCase().includes(query);
    const typeMatch = typeFilter === 'all' || doc.docType === typeFilter;
    const relatedMatch = relatedFilter === 'all' || doc.relatedTo === relatedFilter;
    return matchesSearch && typeMatch && relatedMatch;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setRelatedFilter('all');
  };

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newDoc: RealEstateDocument = {
      id: `doc-${Date.now()}`,
      name: formData.name || 'Documento',
      docType: formData.docType || 'Documento',
      relatedTo: formData.relatedTo || '-',
      uploadedAt: formData.uploadedAt || '-'
    };
    setDocuments(prev => [newDoc, ...prev]);
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
        <h3 className="text-lg font-semibold text-gray-900">Documentos</h3>
        <p className="text-sm text-gray-500">Organize contratos, laudos e arquivos vinculados.</p>
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
              Novo documento
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-[1.125rem] h-[1.125rem]" />
            <input
              type="text"
              placeholder="Buscar por nome, tipo ou relacionado"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={event => setTypeFilter(event.target.value)}
            className={inputClass}
          >
            {types.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'Tipo (todos)' : type}
              </option>
            ))}
          </select>
          <select
            value={relatedFilter}
            onChange={event => setRelatedFilter(event.target.value)}
            className={inputClass}
          >
            {related.map(item => (
              <option key={item} value={item}>
                {item === 'all' ? 'Relacionado a (todos)' : item}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 text-xs text-gray-500">{filtered.length} documentos encontrados</div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wide text-[0.6875rem]">
              <tr>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Relacionado a</th>
                <th className="px-4 py-3">Upload</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900">{doc.name}</td>
                  <td className="px-4 py-3 text-gray-700">{doc.docType}</td>
                  <td className="px-4 py-3 text-gray-600">{doc.relatedTo}</td>
                  <td className="px-4 py-3 text-gray-600">{doc.uploadedAt}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">Ver</button>
                    <span className="mx-2 text-gray-300">|</span>
                    <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Baixar</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    Nenhum documento encontrado com os filtros atuais.
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
                <h4 className="text-sm font-semibold text-gray-900">Novo documento</h4>
                <p className="text-xs text-gray-500">Adicione um arquivo a biblioteca.</p>
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
                  <label className={labelClass}>Nome do documento</label>
                  <input
                    className={inputClass}
                    value={formData.name}
                    onChange={event => setFormData(prev => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tipo</label>
                  <input
                    className={inputClass}
                    value={formData.docType}
                    onChange={event => setFormData(prev => ({ ...prev, docType: event.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Relacionado a</label>
                  <input
                    className={inputClass}
                    value={formData.relatedTo}
                    onChange={event => setFormData(prev => ({ ...prev, relatedTo: event.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Data de upload</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={formData.uploadedAt}
                    onChange={event => setFormData(prev => ({ ...prev, uploadedAt: event.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNewModal(false)} className={modalSecondaryButtonClass}>
                  Cancelar
                </button>
                <button type="submit" className={modalPrimaryButtonClass}>
                  Salvar documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealEstateDocuments;
