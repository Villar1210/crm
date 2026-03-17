import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Plus, Search, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';

interface Tenant {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  tenantProfile?: {
    analysisStatus: 'pending' | 'approved' | 'rejected';
    incomeProof?: string;
  };
  _count?: {
    contracts: number;
  };
}

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
  document: '',
  phone: '',
  email: '',
  income: '',
  employer: ''
};

const RealEstateTenants: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [analysisFilter, setAnalysisFilter] = useState('all');

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const data = await api.realEstate.persons.list({ type: 'TENANT' });
      setTenants(data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

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

  const filteredTenants = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return tenants.filter(tenant => {
      const matchesSearch =
        !query ||
        tenant.name.toLowerCase().includes(query) ||
        (tenant.document && tenant.document.toLowerCase().includes(query)) ||
        (tenant.email && tenant.email.toLowerCase().includes(query));

      const matchesAnalysis = analysisFilter === 'all' || tenant.tenantProfile?.analysisStatus === analysisFilter;

      return matchesSearch && matchesAnalysis;
    });
  }, [tenants, searchTerm, analysisFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setAnalysisFilter('all');
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = {
        type: 'TENANT',
        name: formData.name,
        document: formData.document,
        phone: formData.phone,
        email: formData.email,
        tenantProfile: {
          employer: formData.employer,
          // income: Number(formData.income) // If schema had income in profile
          analysisStatus: 'pending'
        }
      };

      await api.realEstate.persons.create(payload);
      await fetchTenants();
      setFormData(initialForm);
      setShowNewModal(false);
    } catch (error) {
      console.error(error);
      alert('Erro ao criar inquilino');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Inquilinos</h3>
        <p className="text-sm text-gray-500">Gestao de inquilinos e analises cadastrais.</p>
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
            <button type="button" onClick={() => navigate('/admin/gestao-imobiliaria/moradores/novo')} className={primaryButtonClass}>
              <Plus className="w-3.5 h-3.5" />
              Novo inquilino
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-[1.125rem] h-[1.125rem]" />
            <input
              type="text"
              placeholder="Buscar por nome, documento ou email"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={analysisFilter}
            onChange={event => setAnalysisFilter(event.target.value)}
            className={inputClass}
          >
            <option value="all">Status Analise (todos)</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Reprovado</option>
          </select>
        </div>
        <div className="mt-3 text-xs text-gray-500">{filteredTenants.length} inquilinos encontrados</div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wide text-[0.6875rem]">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Analise</th>
                <th className="px-4 py-3">Contratos Ativos</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="p-4 text-center">Carregando...</td></tr>
              ) : filteredTenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{tenant.name}</p>
                    <p className="text-xs text-gray-500">{tenant.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{tenant.document || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{tenant.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold ${tenant.tenantProfile?.analysisStatus === 'approved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : tenant.tenantProfile?.analysisStatus === 'rejected'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                        }`}
                    >
                      {tenant.tenantProfile?.analysisStatus === 'approved' ? 'Aprovado' :
                        tenant.tenantProfile?.analysisStatus === 'rejected' ? 'Reprovado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-center">{tenant._count?.contracts || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">Ver detalhes</button>
                  </td>
                </tr>
              ))}
              {!loading && filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Nenhum inquilino encontrado.
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
                <h4 className="text-sm font-semibold text-gray-900">Cadastrar Inquilino</h4>
              </div>
              <button onClick={() => setShowNewModal(false)} className="p-2 text-gray-400 hover:bg-slate-100 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nome</label>
                  <input className={inputClass} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <label className={labelClass}>Documento</label>
                  <input className={inputClass} value={formData.document} onChange={e => setFormData({ ...formData, document: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" className={inputClass} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Telefone</label>
                  <input className={inputClass} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Empresa (Trabalho)</label>
                  <input className={inputClass} value={formData.employer} onChange={e => setFormData({ ...formData, employer: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewModal(false)} className={modalSecondaryButtonClass}>Cancelar</button>
                <button type="submit" className={modalPrimaryButtonClass}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealEstateTenants;
