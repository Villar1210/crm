import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Plus, Search, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';

// Interface matching the backend response + UI needs
interface Owner {
  id: string;
  name: string;
  type: 'PF' | 'PJ';
  document: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive'; // Mapping 'active' -> 'em dia' logic if needed
  // Expanded fields from profile
  ownerProfile?: {
    bankName?: string;
    agency?: string;
    account?: string;
    pixKey?: string;
  };
  _count?: {
    properties: number;
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

const typeOptions = ['PF', 'PJ'];
const statusOptions = ['active', 'inactive'];

const initialForm = {
  name: '',
  type: 'PF',
  document: '',
  phone: '',
  email: '',
  bankName: '',
  agency: '',
  account: '',
  pixKey: ''
};

const RealEstateOwners: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const data = await api.realEstate.persons.list({ type: 'OWNER' });
      // Map backend data if necessary, or usage matches
      setOwners(data);
    } catch (error) {
      console.error('Failed to fetch owners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
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

  const filteredOwners = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return owners.filter(owner => {
      const matchesSearch =
        !query ||
        owner.name.toLowerCase().includes(query) ||
        (owner.document && owner.document.toLowerCase().includes(query)) ||
        (owner.email && owner.email.toLowerCase().includes(query));
      const matchesType = typeFilter === 'all' || owner.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || owner.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [owners, searchTerm, statusFilter, typeFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = {
        type: 'OWNER',
        name: formData.name,
        // Using 'type' field from person for PF/PJ? Actually schema has 'type' which is 'OWNER'.
        // We might need to store PF/PJ in 'documentType' or 'notes' if schema doesn't have it.
        // Wait, schema Person has 'type' = OWNER.
        // OwnerProfile doesn't have PF/PJ.
        // I'll put it in notes or assume usage of 'documentType' for now, or just 'type' field if I can overload it?
        // No, Keep 'type' as OWNER.
        // I will just save the Person. `document` length usually implies PF/PJ.

        document: formData.document,
        phone: formData.phone,
        email: formData.email,
        ownerProfile: {
          bankName: formData.bankName,
          agency: formData.agency,
          account: formData.account,
          pixKey: formData.pixKey
        }
      };

      await api.realEstate.persons.create(payload);
      await fetchOwners();
      setFormData(initialForm);
      setShowNewModal(false);
    } catch (error) {
      console.error('Failed to create owner:', error);
      alert('Erro ao criar proprietario.');
    }
  };

  const closeModal = () => setSelectedOwner(null);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Proprietarios</h3>
        <p className="text-sm text-gray-500">Gestao de proprietarios e repasses mensais.</p>
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
            <button type="button" onClick={() => navigate('/admin/gestao-imobiliaria/proprietarios/novo')} className={primaryButtonClass}>
              <Plus className="w-3.5 h-3.5" />
              Novo proprietario
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
            value={typeFilter}
            onChange={event => setTypeFilter(event.target.value)}
            className={inputClass}
          >
            <option value="all">Tipo (todos)</option>
            {typeOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            className={inputClass}
          >
            <option value="all">Situacao (todas)</option>
            {statusOptions.map(option => (
              <option key={option} value={option}>
                {option === 'active' ? 'Ativo' : 'Inativo'}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 text-xs text-gray-500">{filteredOwners.length} proprietarios encontrados</div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wide text-[0.6875rem]">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Imoveis</th>
                <th className="px-4 py-3">Contratos</th>
                <th className="px-4 py-3">Situacao</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="p-4 text-center">Carregando...</td></tr>
              ) : filteredOwners.map(owner => (
                <tr key={owner.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{owner.name}</p>
                    <p className="text-xs text-gray-500">{owner.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{owner.document || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{owner._count?.properties || 0}</td>
                  <td className="px-4 py-3 text-gray-700">{owner._count?.contracts || 0}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold ${owner.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                      {owner.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedOwner(owner)}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredOwners.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Nenhum proprietario encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-xl border border-slate-100 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Cadastrar proprietario</h4>
                <p className="text-xs text-gray-500">Informe os dados principais do proprietario.</p>
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
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Dados Pessoais</h5>
                </div>
                <div>
                  <label className={labelClass}>Nome</label>
                  <input
                    className={inputClass}
                    value={formData.name}
                    onChange={event => setFormData(prev => ({ ...prev, name: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Tipo</label>
                  <select
                    className={inputClass}
                    value={formData.type}
                    onChange={event => setFormData(prev => ({ ...prev, type: event.target.value }))}
                  >
                    <option value="PF">Pessoa Fisica</option>
                    <option value="PJ">Pessoa Juridica</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Documento (CPF/CNPJ)</label>
                  <input
                    className={inputClass}
                    value={formData.document}
                    onChange={event => setFormData(prev => ({ ...prev, document: event.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Telefone</label>
                  <input
                    className={inputClass}
                    value={formData.phone}
                    onChange={event => setFormData(prev => ({ ...prev, phone: event.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={formData.email}
                    onChange={event => setFormData(prev => ({ ...prev, email: event.target.value }))}
                  />
                </div>

                <div className="md:col-span-2 mt-2">
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Dados Bancarios</h5>
                </div>
                <div>
                  <label className={labelClass}>Banco</label>
                  <input
                    className={inputClass}
                    value={formData.bankName}
                    onChange={event => setFormData(prev => ({ ...prev, bankName: event.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Agencia</label>
                  <input
                    className={inputClass}
                    value={formData.agency}
                    onChange={event => setFormData(prev => ({ ...prev, agency: event.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Conta</label>
                  <input
                    className={inputClass}
                    value={formData.account}
                    onChange={event => setFormData(prev => ({ ...prev, account: event.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Chave Pix</label>
                  <input
                    className={inputClass}
                    value={formData.pixKey}
                    onChange={event => setFormData(prev => ({ ...prev, pixKey: event.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNewModal(false)} className={modalSecondaryButtonClass}>
                  Cancelar
                </button>
                <button type="submit" className={modalPrimaryButtonClass}>
                  Salvar proprietario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOwner && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center p-6 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedOwner.name}</h3>
                <p className="text-xs text-gray-500">{selectedOwner.document}</p>
              </div>
              <button onClick={closeModal} className="text-sm font-semibold text-gray-500 hover:text-gray-700">
                Fechar
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Contato</p>
                  <p className="font-semibold text-gray-900">{selectedOwner.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">E-mail</p>
                  <p className="font-semibold text-gray-900">{selectedOwner.email || '-'}</p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Dados Bancarios</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Banco</p>
                    <p className="font-medium text-gray-800">{selectedOwner.ownerProfile?.bankName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Agencia/Conta</p>
                    <p className="font-medium text-gray-800">{selectedOwner.ownerProfile?.agency || '-'} / {selectedOwner.ownerProfile?.account || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pix</p>
                    <p className="font-medium text-gray-800">{selectedOwner.ownerProfile?.pixKey || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealEstateOwners;
