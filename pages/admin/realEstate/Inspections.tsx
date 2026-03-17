import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { format } from 'date-fns';

interface Inspection {
  id: string;
  type: string;
  propertyId: string;
  property: { title: string };
  date: string;
  inspectorName?: string;
  status: string;
  notes?: string;
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
  date: '',
  type: 'entrada',
  status: 'scheduled',
  notes: '',
  inspectorName: ''
};

const RealEstateInspections: React.FC = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [properties, setProperties] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const [insp, props] = await Promise.all([
        api.realEstate.inspections.list(),
        api.properties.getAll()
      ]);
      setInspections(insp);
      setProperties(props.map((p: any) => ({ id: p.id, label: p.title })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.realEstate.inspections.create({
        ...formData,
        date: new Date(formData.date).toISOString() // Send ISO
      });
      fetchData();
      setShowNewModal(false);
      setFormData(initialForm);
    } catch (err) {
      alert('Erro ao criar vistoria');
    }
  };

  const filtered = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return inspections.filter(i =>
      i.property?.title?.toLowerCase().includes(query) ||
      i.type.toLowerCase().includes(query)
    );
  }, [inspections, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Vistorias</h3>
        <p className="text-sm text-gray-500">Agendamento e controle de vistorias.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2"><Filter className="w-4 h-4" /> Filtros</div>
          <button onClick={() => navigate('/admin/gestao-imobiliaria/vistorias/novo')} className={primaryButtonClass}><Plus className="w-4 h-4" /> Agendar Vistoria</button>
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
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={4} className="p-4 text-center">Carregando...</td></tr>}
            {filtered.map(i => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{i.property?.title}</td>
                <td className="px-4 py-3 capitalize">{i.type}</td>
                <td className="px-4 py-3">{i.date ? format(new Date(i.date), 'dd/MM/yyyy') : '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${i.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>{i.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg">
            <h3 className="font-bold mb-4">Nova Vistoria</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className={labelClass}>Imovel</label>
                <select className={inputClass} value={formData.propertyId} onChange={e => setFormData({ ...formData, propertyId: e.target.value })} required>
                  <option value="">Selecione...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Tipo</label>
                <select className={inputClass} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saida</option>
                  <option value="periodica">Periodica</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Data</label>
                <input type="date" className={inputClass} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewModal(false)} className={modalSecondaryButtonClass}>Cancelar</button>
                <button type="submit" className={modalPrimaryButtonClass}>Agendar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealEstateInspections;
