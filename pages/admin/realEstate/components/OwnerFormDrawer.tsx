
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { api } from '../../../../services/api';

interface OwnerFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (personId: string, person: any) => void;
}

const inputClass = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500';
const labelClass = 'block text-xs font-medium text-slate-500 mb-1';

export const OwnerFormDrawer: React.FC<OwnerFormDrawerProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'PF',
        document: '',
        email: '',
        phone: '',
        whatsapp: '',
        zipCode: '',
        address: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        bankName: '',
        agency: '',
        account: '',
        pixKey: '',
        payoutPreference: 'mensal',
        adminFee: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                role_type: 'OWNER',
                person_kind: formData.type,
                name: formData.name,
                document: formData.document,
                email: formData.email,
                phone: formData.phone,
                whatsapp: formData.whatsapp,
                tenantId: 'default-tenant-id', // Should come from context/auth

                address_data: {
                    zipCode: formData.zipCode,
                    street: formData.address,
                    number: formData.number,
                    neighborhood: formData.neighborhood,
                    city: formData.city,
                    state: formData.state
                },

                profile_data: {
                    bank_name: formData.bankName,
                    agency: formData.agency,
                    account: formData.account,
                    pix_key: formData.pixKey,
                    payout_preference: formData.payoutPreference,
                    admin_fee_percent: formData.adminFee
                }
            };

            // Note: api.realEstate.persons.create expects params that match server controller
            // Server controller expects: role_type, person_kind, name, document, etc.
            // My payload here matches that structure.

            const response = await api.realEstate.persons.create(payload);
            onSuccess(response.id, response);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar proprietario.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-bold text-lg">Novo Proprietario</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6">
                    {/* Identification */}
                    <div>
                        <h4 className="font-semibold text-sm mb-3">Identificacao</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className={labelClass}>Nome Completo</label>
                                <input required className={inputClass} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Tipo</label>
                                <select className={inputClass} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="PF">Pessoa Fisica</option>
                                    <option value="PJ">Pessoa Juridica</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>CPF/CNPJ</label>
                                <input required className={inputClass} value={formData.document} onChange={e => setFormData({ ...formData, document: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-semibold text-sm mb-3">Contato</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className={labelClass}>Email</label>
                                <input required type="email" className={inputClass} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Telefone</label>
                                <input className={inputClass} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>WhatsApp</label>
                                <input className={inputClass} value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <h4 className="font-semibold text-sm mb-3">Endereço</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>CEP</label>
                                <input className={inputClass} value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Cidade/UF</label>
                                <input className={inputClass} value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Cidade" />
                            </div>
                            <div className="col-span-2">
                                <label className={labelClass}>Logradouro</label>
                                <input className={inputClass} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Numero</label>
                                <input className={inputClass} value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Bairro</label>
                                <input className={inputClass} value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Banking */}
                    <div>
                        <h4 className="font-semibold text-sm mb-3">Dados Bancarios</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className={labelClass}>Banco</label>
                                <input className={inputClass} value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Agencia</label>
                                <input className={inputClass} value={formData.agency} onChange={e => setFormData({ ...formData, agency: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Conta</label>
                                <input className={inputClass} value={formData.account} onChange={e => setFormData({ ...formData, account: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>PIX</label>
                                <input className={inputClass} value={formData.pixKey} onChange={e => setFormData({ ...formData, pixKey: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Repasse</label>
                                <select className={inputClass} value={formData.payoutPreference} onChange={e => setFormData({ ...formData, payoutPreference: e.target.value })}>
                                    <option value="mensal">Mensal</option>
                                    <option value="imediato">Imediato</option>
                                </select>
                            </div>
                        </div>
                    </div>

                </form>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        {loading ? 'Salvando...' : 'Salvar Proprietario'}
                    </button>
                </div>
            </div>
        </div>
    );
};
