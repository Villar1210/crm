
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { api } from '../../../../services/api';

interface GuarantorFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (personId: string, person: any) => void;
}

const inputClass = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500';
const labelClass = 'block text-xs font-medium text-slate-500 mb-1';

export const GuarantorFormDrawer: React.FC<GuarantorFormDrawerProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        document: '',
        email: '',
        phone: '',
        income: '',
        propertyDetails: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                role_type: 'GUARANTOR',
                person_kind: 'PF',
                name: formData.name,
                document: formData.document,
                email: formData.email,
                phone: formData.phone,
                tenantId: 'default-tenant-id', // Context

                profile_data: {
                    income_val: formData.income,
                    properties_desc: formData.propertyDetails
                }
            };

            const response = await api.realEstate.persons.create(payload);
            onSuccess(response.id, response);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar fiador.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-bold text-lg">Novo Fiador</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6">
                    {/* Identification */}
                    <div>
                        <h4 className="font-semibold text-sm mb-3">Dados Pessoais</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className={labelClass}>Nome Completo</label>
                                <input required className={inputClass} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>CPF</label>
                                <input required className={inputClass} value={formData.document} onChange={e => setFormData({ ...formData, document: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Telefone</label>
                                <input required className={inputClass} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <label className={labelClass}>Email</label>
                                <input required type="email" className={inputClass} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Guarantee */}
                    <div>
                        <h4 className="font-semibold text-sm mb-3">Capacidade Financeira</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Renda Comprovada</label>
                                <input className={inputClass} value={formData.income} onChange={e => setFormData({ ...formData, income: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <label className={labelClass}>Imoveis em garantia (Descricao)</label>
                                <textarea rows={3} className={inputClass} value={formData.propertyDetails} onChange={e => setFormData({ ...formData, propertyDetails: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        {loading ? 'Salvando...' : 'Salvar Fiador'}
                    </button>
                </div>
            </div>
        </div>
    );
};
