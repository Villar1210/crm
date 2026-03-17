import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { ArrowLeft, Save, Plus, Trash2, Camera } from 'lucide-react';

const inputClass =
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500';
const labelClass = 'text-xs font-medium text-slate-500';
const cardClass = 'rounded-3xl bg-white shadow-sm border border-slate-100 p-5';

interface ChecklistItem {
    id: string;
    description: string;
    checked: boolean;
    notes: string;
}

const InspectionCreate: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [properties, setProperties] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        propertyId: '',
        type: 'entrada',
        date: '',
        inspectorName: '',
        notes: '',
        status: 'scheduled'
    });

    const [checklist, setChecklist] = useState<ChecklistItem[]>([
        { id: '1', description: 'Pintura Paredes/Teto', checked: false, notes: '' },
        { id: '2', description: 'Piso e Rodapes', checked: false, notes: '' },
        { id: '3', description: 'Portas e Fechaduras', checked: false, notes: '' },
        { id: '4', description: 'Janelas e Vidros', checked: false, notes: '' },
        { id: '5', description: 'Instalacao Eletrica (Tomadas/Luzes)', checked: false, notes: '' },
        { id: '6', description: 'Instalacao Hidraulica (Torneiras/Descargas)', checked: false, notes: '' },
    ]);

    useEffect(() => {
        api.properties.getAll().then(setProperties);
    }, []);

    const handleChecklistChange = (id: string, field: keyof ChecklistItem, value: any) => {
        setChecklist(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const addChecklistItem = () => {
        setChecklist(prev => [...prev, { id: Date.now().toString(), description: '', checked: false, notes: '' }]);
    };

    const removeChecklistItem = (id: string) => {
        setChecklist(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.realEstate.inspections.create({
                ...formData,
                date: formData.date ? new Date(formData.date).toISOString() : undefined,
                checklist: JSON.stringify(checklist) // Store checklist as JSON string
            });
            navigate('/admin/gestao-imobiliaria/vistorias');
        } catch (error) {
            console.error(error);
            alert('Erro ao criar vistoria');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/gestao-imobiliaria/vistorias')}
                    className="p-2 hover:bg-slate-100 rounded-full transition"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Nova Vistoria</h3>
                    <p className="text-sm text-gray-500">Agendar vistoria de entrada, saida ou periodica.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <section className={cardClass}>
                            <h4 className="text-sm font-semibold text-slate-900 mb-4">Dados Gerais</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>Imovel *</label>
                                    <select
                                        className={inputClass}
                                        required
                                        value={formData.propertyId}
                                        onChange={e => setFormData({ ...formData, propertyId: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Tipo de Vistoria</label>
                                    <select
                                        className={inputClass}
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="entrada">Entrada</option>
                                        <option value="saida">Saida</option>
                                        <option value="periodica">Periodica</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Data Agendada</label>
                                    <input
                                        type="datetime-local"
                                        className={inputClass}
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Vistoriador</label>
                                    <input
                                        className={inputClass}
                                        value={formData.inspectorName}
                                        onChange={e => setFormData({ ...formData, inspectorName: e.target.value })}
                                        placeholder="Nome do responsavel"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Notas Gerais</label>
                                    <textarea
                                        className={inputClass}
                                        rows={3}
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className={cardClass}>
                            <h4 className="text-sm font-semibold text-slate-900 mb-4">Fotos</h4>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer">
                                <Camera className="w-8 h-8 text-slate-400 mb-2" />
                                <span className="text-sm text-slate-500">Adicionar Fotos</span>
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-2">
                        <section className={cardClass}>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-semibold text-slate-900">Checklist de Vistoria</h4>
                                <button type="button" onClick={addChecklistItem} className="text-brand-600 text-xs font-semibold hover:text-brand-700 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Adicionar Item
                                </button>
                            </div>

                            <div className="space-y-3">
                                {checklist.map((item) => (
                                    <div key={item.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                                        <div className="flex items-start gap-3">
                                            <div className="pt-2">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                                    checked={item.checked}
                                                    onChange={e => handleChecklistChange(item.id, 'checked', e.target.checked)}
                                                />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    className="w-full bg-transparent border-none p-0 text-sm font-semibold focus:ring-0 placeholder:font-normal"
                                                    placeholder="Item da vistoria (ex: Pintura Sala)"
                                                    value={item.description}
                                                    onChange={e => handleChecklistChange(item.id, 'description', e.target.value)}
                                                />
                                                <input
                                                    className="w-full text-xs text-gray-500 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-brand-500"
                                                    placeholder="Observacoes do estado (ex: Manchas na parede leste)"
                                                    value={item.notes}
                                                    onChange={e => handleChecklistChange(item.id, 'notes', e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeChecklistItem(item.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 lg:pl-72 z-40 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/gestao-imobiliaria/vistorias')}
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
                        Salvar Vistoria
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InspectionCreate;
