import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { ArrowLeft, Save, Calculator } from 'lucide-react';

const inputClass =
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500';
const labelClass = 'text-xs font-medium text-slate-500';
const cardClass = 'rounded-3xl bg-white shadow-sm border border-slate-100 p-5';

const InvoiceCreate: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [contracts, setContracts] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        contractId: '',
        referenceMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
        dueDate: '',
        description: '',
        amountRent: 0,
        amountCondo: 0,
        amountIptu: 0,
        amountExtra: 0,
        amountDiscount: 0,
        amountTotal: 0,
    });

    useEffect(() => {
        // Fetch active contracts to populate dropdown
        api.realEstate.contracts.list().then(data => {
            // Filter only active contracts if needed
            setContracts(data);
        });
    }, []);

    // When contract changes, pre-fill values
    const handleContractChange = (contractId: string) => {
        const contract = contracts.find(c => c.id === contractId);
        if (contract) {
            setFormData(prev => ({
                ...prev,
                contractId,
                amountRent: contract.rentValue || 0,
                amountCondo: contract.condoValue || 0,
                amountIptu: contract.iptuValue || 0,
                dueDate: new Date().toISOString().slice(0, 10) // defaulting to today, logic could be better
            }));
        } else {
            setFormData(prev => ({ ...prev, contractId }));
        }
    };

    // Recalculate Total
    useEffect(() => {
        const total =
            Number(formData.amountRent) +
            Number(formData.amountCondo) +
            Number(formData.amountIptu) +
            Number(formData.amountExtra) -
            Number(formData.amountDiscount);
        setFormData(prev => ({ ...prev, amountTotal: total }));
    }, [formData.amountRent, formData.amountCondo, formData.amountIptu, formData.amountExtra, formData.amountDiscount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.realEstate.finance.createInvoice({
                ...formData,
                referenceMonth: new Date(formData.referenceMonth + '-01'),
                dueDate: new Date(formData.dueDate)
            });
            navigate('/admin/gestao-imobiliaria/financeiro');
        } catch (error) {
            console.error(error);
            alert('Erro ao criar cobranca');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/gestao-imobiliaria/financeiro')}
                    className="p-2 hover:bg-slate-100 rounded-full transition"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Nova Cobrança</h3>
                    <p className="text-sm text-gray-500">Gerar boleto/cobranca manual para inquilino.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className={cardClass}>
                    <h4 className="text-sm font-semibold text-slate-900 mb-4">Dados da Cobrança</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Contrato *</label>
                            <select
                                className={inputClass}
                                required
                                value={formData.contractId}
                                onChange={e => handleContractChange(e.target.value)}
                            >
                                <option value="">Selecione o contrato...</option>
                                {contracts.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.property?.title} - {c.tenant?.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Competencia (Mes/Ano)</label>
                            <input
                                type="month"
                                className={inputClass}
                                value={formData.referenceMonth}
                                onChange={e => setFormData({ ...formData, referenceMonth: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Vencimento</label>
                            <input
                                type="date"
                                className={inputClass}
                                required
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Descricao (Opcional)</label>
                            <input
                                className={inputClass}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Ex: Aluguel proporcional + Taxa extra"
                            />
                        </div>
                    </div>
                </section>

                <section className={cardClass}>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-slate-900">Valores</h4>
                        <Calculator className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Aluguel (R$)</label>
                            <input
                                type="number" step="0.01"
                                className={inputClass}
                                value={formData.amountRent}
                                onChange={e => setFormData({ ...formData, amountRent: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Condominio (R$)</label>
                            <input
                                type="number" step="0.01"
                                className={inputClass}
                                value={formData.amountCondo}
                                onChange={e => setFormData({ ...formData, amountCondo: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>IPTU (R$)</label>
                            <input
                                type="number" step="0.01"
                                className={inputClass}
                                value={formData.amountIptu}
                                onChange={e => setFormData({ ...formData, amountIptu: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Taxas Extras (R$)</label>
                            <input
                                type="number" step="0.01"
                                className={inputClass}
                                value={formData.amountExtra}
                                onChange={e => setFormData({ ...formData, amountExtra: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Des desconto (R$)</label>
                            <input
                                type="number" step="0.01"
                                className={inputClass + ' text-red-600'}
                                value={formData.amountDiscount}
                                onChange={e => setFormData({ ...formData, amountDiscount: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Total a Pagar</label>
                            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-gray-900">
                                {formData.amountTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/gestao-imobiliaria/financeiro')}
                        className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 transition flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Gerar Cobranca
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InvoiceCreate;
