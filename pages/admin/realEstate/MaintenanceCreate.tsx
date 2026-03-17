import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { ArrowLeft, Save, AlertTriangle, Camera } from 'lucide-react';

const inputClass =
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500';
const labelClass = 'text-xs font-medium text-slate-500';
const cardClass = 'rounded-3xl bg-white shadow-sm border border-slate-100 p-5';

const MaintenanceCreate: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [properties, setProperties] = useState<any[]>([]);
    const [providers, setProviders] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        propertyId: '',
        type: 'corrective', // corrective, preventive
        category: '', // electric, hydraulic, etc
        priority: 'medium',
        status: 'open',
        description: '',
        estimatedCost: '',
        assignedTo: '', // Provider Name or ID? Schema has assignedTo String. I'll store Name or ID. Let's store Name for now or ID if mapped. Schema keys it as String, not relation.
        scheduledDate: ''
    });

    useEffect(() => {
        // Fetch properties
        api.properties.getAll().then(setProperties);
        // Fetch providers (Suppliers)
        api.realEstate.persons.list({ type: 'SUPPLIER' }).then(setProviders);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.realEstate.maintenance.create({
                ...formData,
                estimatedCost: formData.estimatedCost ? Number(formData.estimatedCost) : undefined,
                scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : undefined
            });
            navigate('/admin/gestao-imobiliaria/manutencoes');
        } catch (error) {
            console.error(error);
            alert('Erro ao criar chamado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/gestao-imobiliaria/manutencoes')}
                    className="p-2 hover:bg-slate-100 rounded-full transition"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Novo Chamado de Manutenção</h3>
                    <p className="text-sm text-gray-500">Registrar solicitacao de reparo ou manutencao preventiva.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className={cardClass}>
                            <h4 className="text-sm font-semibold text-slate-900 mb-4">Detalhes do Chamado</h4>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className={labelClass}>Imovel *</label>
                                    <select
                                        className={inputClass}
                                        required
                                        value={formData.propertyId}
                                        onChange={e => setFormData({ ...formData, propertyId: e.target.value })}
                                    >
                                        <option value="">Selecione o imovel...</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Tipo</label>
                                        <select
                                            className={inputClass}
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="corrective">Corretiva</option>
                                            <option value="preventive">Preventiva</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Categoria</label>
                                        <select
                                            className={inputClass}
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="eletrica">Eletrica</option>
                                            <option value="hidraulica">Hidraulica</option>
                                            <option value="estrutural">Estrutural</option>
                                            <option value="pintura">Pintura</option>
                                            <option value="outros">Outros</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Descricao Detalhada *</label>
                                    <textarea
                                        className={inputClass}
                                        rows={4}
                                        required
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Descreva o problema ou servico necessario..."
                                    />
                                </div>
                            </div>
                        </section>

                        <section className={cardClass}>
                            <h4 className="text-sm font-semibold text-slate-900 mb-4">Agendamento e Custo</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Prestador de Servico</label>
                                    <select
                                        className={inputClass}
                                        value={formData.assignedTo}
                                        onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                                    >
                                        <option value="">Selecione (ou deixe em aberto)</option>
                                        {providers.map(p => (
                                            <option key={p.id} value={p.name}>{p.name} ({p.profession || 'Prestador'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Data Agendada</label>
                                    <input
                                        type="datetime-local"
                                        className={inputClass}
                                        value={formData.scheduledDate}
                                        onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Custo Estimado (R$)</label>
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={formData.estimatedCost}
                                        onChange={e => setFormData({ ...formData, estimatedCost: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Meta & Photos */}
                    <div className="space-y-6">
                        <section className={cardClass}>
                            <h4 className="text-sm font-semibold text-slate-900 mb-4">Prioridade</h4>
                            <div className="space-y-2">
                                {['low', 'medium', 'high', 'urgent'].map(p => (
                                    <label key={p} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${formData.priority === p ? 'border-brand-500 bg-brand-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                                        <input
                                            type="radio"
                                            name="priority"
                                            value={p}
                                            checked={formData.priority === p}
                                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                            className="text-brand-600 focus:ring-brand-500"
                                        />
                                        <div className="flex-1">
                                            <span className="block text-sm font-semibold text-slate-700 capitalize">
                                                {p === 'low' ? 'Baixa' : p === 'medium' ? 'Media' : p === 'high' ? 'Alta' : 'Urgente'}
                                            </span>
                                        </div>
                                        {p === 'urgent' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                    </label>
                                ))}
                            </div>
                        </section>

                        <section className={cardClass}>
                            <h4 className="text-sm font-semibold text-slate-900 mb-4">Fotos</h4>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer">
                                <Camera className="w-8 h-8 text-slate-400 mb-2" />
                                <span className="text-sm text-slate-500">Clique para adicionar fotos</span>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 lg:pl-72 z-40 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/gestao-imobiliaria/manutencoes')}
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
                        Salvar Chamado
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MaintenanceCreate;
