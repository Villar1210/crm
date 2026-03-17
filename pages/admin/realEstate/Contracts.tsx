
import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';

interface Contract {
  id: string;
  code: string;
  propertyId: string;
  property?: { title: string; address: string };
  ownerId: string;
  owner?: { person: { name: string } };
  tenantId: string;
  tenant?: { name: string };
  startDate: string;
  endDate: string;
  rentValue: number;
  status: 'draft' | 'active' | 'pending_signature' | 'ended' | 'terminated';
  readjustmentIndex?: string;
  guarantee?: { type: string };
}

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500';
const primaryButtonClass =
  'inline-flex items-center gap-2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 transition';

const RealEstateContracts: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const data = await api.realEstate.contracts.list();
      setContracts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleNewContract = () => {
    navigate('/admin/gestao-imobiliaria/contratos/novo');
  };

  const openDetails = (id: string) => {
    navigate(`/admin/gestao-imobiliaria/contratos/${id}`);
  };

  const filteredContracts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return contracts.filter(c =>
      c.code?.toLowerCase().includes(query) ||
      c.tenant?.name?.toLowerCase().includes(query) ||
      c.property?.title?.toLowerCase().includes(query) ||
      c.owner?.person?.name?.toLowerCase().includes(query)
    );
  }, [contracts, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Contratos</h3>
        <p className="text-sm text-gray-500">Controle de contratos, garantias e reajustes.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter className="w-4 h-4" />
            Filtros
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleNewContract} className={primaryButtonClass}>
              <Plus className="w-3.5 h-3.5" />
              Novo contrato
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              className={inputClass + " pl-9"}
              placeholder="Buscar contrato..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wide text-[0.6875rem]">
              <tr>
                <th className="px-4 py-3">Codigo</th>
                <th className="px-4 py-3">Imovel</th>
                <th className="px-4 py-3">Proprietario</th>
                <th className="px-4 py-3">Inquilino</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && <tr><td colSpan={6} className="p-4 text-center">Carregando...</td></tr>}
              {!loading && filteredContracts.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-500">Nenhum contrato encontrado.</td></tr>}
              {filteredContracts.map(contract => (
                <tr key={contract.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => openDetails(contract.id)}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{contract.code || contract.id.slice(0, 6).toUpperCase()}</td>
                  <td className="px-4 py-3 text-gray-700">{contract.property?.title || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-700">{contract.owner?.person?.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-700">{contract.tenant?.name || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${contract.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      contract.status === 'draft' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{contract.status === 'active' ? 'Ativo' : contract.status === 'draft' ? 'Rascunho' : contract.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); openDetails(contract.id); }} className="text-brand-600 font-semibold hover:underline">Ver detalhes</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RealEstateContracts;

