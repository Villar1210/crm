import React, { useEffect, useMemo, useState } from 'react';
import { Search, Check } from 'lucide-react'; // Added Check icon
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { format } from 'date-fns';

interface Charge {
  id: string;
  party: string;
  property: string;
  competence: string;
  amount: number;
  dueDate: string;
  status: string;
  original: any; // Keep original object for actions
}

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500';
const ghostButtonClass =
  'inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-slate-50 transition';
const primaryButtonClass =
  'inline-flex items-center gap-2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 transition';

const RealEstateFinance: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'receber' | 'pagar'>('receber');
  const [items, setItems] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    setItems([]);
    try {
      if (activeTab === 'receber') {
        const data = await api.realEstate.finance.listInvoices();
        // Map Invoices
        const mapped: Charge[] = data.map((inv: any) => ({
          id: inv.id,
          party: inv.contract?.tenant?.name || 'Desconhecido',
          property: inv.contract?.property?.title || 'Desconhecido',
          competence: inv.referenceMonth ? format(new Date(inv.referenceMonth), 'MM/yyyy') : '-',
          amount: inv.amountTotal,
          dueDate: inv.dueDate ? format(new Date(inv.dueDate), 'dd/MM/yyyy') : '-',
          status: inv.status,
          original: inv
        }));
        setItems(mapped);
      } else {
        const data = await api.realEstate.finance.listPayouts();
        // Map Payouts
        const mapped: Charge[] = data.map((pay: any) => ({
          id: pay.id,
          party: pay.owner?.person?.name || 'Desconhecido',
          property: '-', // Payouts are per owner usually
          competence: pay.referenceMonth ? format(new Date(pay.referenceMonth), 'MM/yyyy') : '-',
          amount: pay.amount,
          dueDate: pay.paidAt ? format(new Date(pay.paidAt), 'dd/MM/yyyy') : '-',
          status: pay.status,
          original: pay
        }));
        setItems(mapped);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const handlePay = async (id: string, amount: number) => {
    if (!confirm('Confirmar recebimento deste valor?')) return;
    try {
      await api.realEstate.finance.payInvoice(id, {
        paidAmount: amount,
        paymentMethod: 'pix', // Default for updated UI later
        paidAt: new Date()
      });
      fetchItems();
    } catch (error) {
      alert('Erro ao registrar pagamento');
    }
  };

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return items.filter(item =>
      item.party.toLowerCase().includes(query) ||
      item.property.toLowerCase().includes(query)
    );
  }, [items, searchTerm]);

  // Stats
  const totalAmount = items.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = items.filter(i => i.status === 'paid' || i.status === 'pago').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = totalAmount - totalPaid;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Financeiro</h3>
        <p className="text-sm text-gray-500">Controle de {activeTab === 'receber' ? 'recebimentos (alugueis)' : 'pagamentos (repasses)'}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs text-gray-500">Total {activeTab === 'receber' ? 'Previsto' : 'a Pagar'}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs text-gray-500">Total {activeTab === 'receber' ? 'Recebido' : 'Pago'}</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs text-gray-500">Pendente</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
        <div className="flex gap-2 mb-4">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('receber')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'receber' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Contas a Receber</button>
            <button onClick={() => setActiveTab('pagar')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'pagar' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Repasses / Contas a Pagar</button>
          </div>
          {activeTab === 'receber' && (
            <button onClick={() => navigate('/admin/gestao-imobiliaria/financeiro/nova-cobranca')} className={primaryButtonClass}>
              Nova Cobrança
            </button>
          )}
          {activeTab === 'pagar' && (
            <button className={ghostButtonClass} disabled>
              Novo Repasse (Auto)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input className={inputClass + " pl-9"} placeholder={`Buscar ${activeTab === 'receber' ? 'inquilino' : 'proprietario'}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wide text-[0.6875rem]">
              <tr>
                <th className="px-4 py-3">{activeTab === 'receber' ? 'Inquilino' : 'Proprietario'}</th>
                <th className="px-4 py-3">Imovel</th>
                <th className="px-4 py-3">Competencia</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && <tr><td colSpan={7} className="p-4 text-center">Carregando...</td></tr>}
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-900">{item.party}</td>
                  <td className="px-4 py-3 text-gray-700">{item.property}</td>
                  <td className="px-4 py-3 text-gray-600">{item.competence}</td>
                  <td className="px-4 py-3 text-gray-600">{item.dueDate}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'paid' || item.status === 'pago' ? 'bg-emerald-100 text-emerald-700' :
                      item.status === 'generated' ? 'bg-blue-50 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                      {item.status === 'generated' ? 'Em aberto' : item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {activeTab === 'receber' && item.status === 'generated' && (
                      <button onClick={() => handlePay(item.id, item.amount)} className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center justify-end gap-1 ml-auto">
                        <Check className="w-4 h-4" /> Baixar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filteredItems.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-gray-500">Nenhum registro encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RealEstateFinance;
