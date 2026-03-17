import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Plus, Search, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { realEstateReportDetails, realEstateReports, RealEstateReport } from './mockData';

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

const reportCategories: Record<string, string> = {
  'rep-01': 'ocupacao',
  'rep-02': 'inadimplencia',
  'rep-03': 'contratos',
  'rep-04': 'financeiro',
  'rep-05': 'financeiro',
  'rep-06': 'proprietarios'
};

const initialForm = {
  reportId: '',
  periodStart: '',
  periodEnd: '',
  format: 'pdf'
};

const RealEstateReports: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reports] = useState<RealEstateReport[]>(() => realEstateReports);
  const [selectedReport, setSelectedReport] = useState<RealEstateReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const categories = useMemo(() => {
    const unique = new Set(Object.values(reportCategories));
    return ['all', ...Array.from(unique)];
  }, []);

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return reports.filter(report => {
      const matchesSearch =
        !query ||
        report.title.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query);
      const category = reportCategories[report.id] ?? 'outros';
      const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, reports, searchTerm]);

  const reportDetail = selectedReport ? realEstateReportDetails[selectedReport.id] : null;

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
  };

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const chosen = reports.find(report => report.id === formData.reportId);
    if (chosen) {
      setSelectedReport(chosen);
    }
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
        <h3 className="text-lg font-semibold text-gray-900">Relatorios</h3>
        <p className="text-sm text-gray-500">Indicadores de ocupacao, contratos e financeiro.</p>
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
              Gerar relatorio
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-[1.125rem] h-[1.125rem]" />
            <input
              type="text"
              placeholder="Buscar por titulo ou descricao"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={event => setCategoryFilter(event.target.value)}
            className={inputClass}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Categoria (todas)' : category}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 text-xs text-gray-500">{filteredReports.length} relatorios encontrados</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredReports.map(report => (
          <div key={report.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
            <h3 className="text-sm font-semibold text-gray-900">{report.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{report.description}</p>
            <button
              onClick={() => setSelectedReport(report)}
              className="mt-3 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Ver relatorio
            </button>
          </div>
        ))}
        {filteredReports.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl shadow-sm border border-slate-100 p-6 text-center text-sm text-gray-500">
            Nenhum relatorio encontrado com os filtros atuais.
          </div>
        )}
      </div>

      {selectedReport && reportDetail && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{selectedReport.title}</h4>
              <p className="text-xs text-gray-500">{selectedReport.description}</p>
            </div>
            <button
              onClick={() => setSelectedReport(null)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Fechar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wide text-[0.6875rem]">
                <tr>
                  {reportDetail.columns.map(column => (
                    <th key={column} className="px-4 py-3">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportDetail.rows.map((row, index) => (
                  <tr key={index}>
                    {row.map(cell => (
                      <td key={cell} className="px-4 py-3 text-gray-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-xl border border-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Gerar relatorio</h4>
                <p className="text-xs text-gray-500">Selecione o tipo e o periodo do relatorio.</p>
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
                <div className="md:col-span-2">
                  <label className={labelClass}>Tipo de relatorio</label>
                  <select
                    className={inputClass}
                    value={formData.reportId}
                    onChange={event => setFormData(prev => ({ ...prev, reportId: event.target.value }))}
                  >
                    <option value="">Selecione</option>
                    {reports.map(report => (
                      <option key={report.id} value={report.id}>
                        {report.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Periodo inicio</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={formData.periodStart}
                    onChange={event => setFormData(prev => ({ ...prev, periodStart: event.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Periodo fim</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={formData.periodEnd}
                    onChange={event => setFormData(prev => ({ ...prev, periodEnd: event.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Formato</label>
                  <select
                    className={inputClass}
                    value={formData.format}
                    onChange={event => setFormData(prev => ({ ...prev, format: event.target.value }))}
                  >
                    <option value="pdf">PDF</option>
                    <option value="xlsx">XLSX</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNewModal(false)} className={modalSecondaryButtonClass}>
                  Cancelar
                </button>
                <button type="submit" className={modalPrimaryButtonClass}>
                  Gerar relatorio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealEstateReports;
