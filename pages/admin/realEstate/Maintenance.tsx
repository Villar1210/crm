import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';

interface MaintenanceTicket {
  id: string;
  ticketNumber?: string;
  property: { title: string; address: string };
  propertyId: string;
  description: string;
  status: string;
  createdAt: string;
  estimatedCost?: number;
}

interface Option {
  id: string;
  label: string;
}

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500';
const labelClass = 'text-xs font-medium text-slate-500';
const primaryButtonClass =
  'inline-flex items-center gap-2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 transition';
const modalPrimaryButtonClass =
  'rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition';
const modalSecondaryButtonClass =
  'rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-slate-50 transition';

const initialForm = {
  propertyId: '',
  description: '',
  status: 'open',
  estimatedCost: ''
};

const RealEstateMaintenance: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [properties, setProperties] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTickets = async () => {
    try {
      const data = await api.realEstate.maintenance.list();
      setTickets(data);
    } catch (e) { console.error(e); }
  };

  const fetchProperties = async () => {
    try {
      const data = await api.properties.getAll();
      setProperties(data.map((p: any) => ({ id: p.id, label: p.title })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTickets(), fetchProperties()]).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.realEstate.maintenance.create({
        ...formData,
        estimatedCost: Number(formData.estimatedCost)
      });
      fetchTickets();
      setShowNewModal(false);
      setFormData(initialForm);
    } catch (err) {
      alert('Erro ao criar chamado');
    }
  };

  const filteredTickets = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return tickets.filter(t =>
      t.description.toLowerCase().includes(query) ||
      t.property?.title?.toLowerCase().includes(query)
    );
  }, [tickets, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Manutencao</h3>
        <p className="text-sm text-gray-500">Gestao de chamados e servicos.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2"><Filter className="w-4 h-4" /> Filtros</div>
          <button onClick={() => navigate('/admin/gestao-imobiliaria/manutencoes/novo')} className={primaryButtonClass}><Plus className="w-4 h-4" /> Novo Chamado</button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input className={inputClass + " pl-9"} placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wide text-[0.6875rem]">
            <tr>
              <th className="px-4 py-3">Imovel</th>
              <th className="px-4 py-3">Descricao</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Custo Est.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={4} className="p-4 text-center">Carregando...</td></tr>}
            {filteredTickets.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{t.property?.title}</td>
                <td className="px-4 py-3">{t.description}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
                    }`}>{t.status}</span>
                </td>
                <td className="px-4 py-3">R$ {t.estimatedCost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg">
            <h3 className="font-bold mb-4">Novo Chamado</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className={labelClass}>Imovel</label>
                <select className={inputClass} value={formData.propertyId} onChange={e => setFormData({ ...formData, propertyId: e.target.value })} required>
                  <option value="">Selecione...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Descricao</label>
                <textarea className={inputClass} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
              </div>
              <div>
                <label className={labelClass}>Custo Estimado</label>
                <input type="number" className={inputClass} value={formData.estimatedCost} onChange={e => setFormData({ ...formData, estimatedCost: e.target.value })} />
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

export default RealEstateMaintenance;
