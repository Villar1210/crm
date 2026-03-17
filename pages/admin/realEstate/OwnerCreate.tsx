import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { ArrowLeft, Save } from 'lucide-react';

const inputClass =
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500';
const labelClass = 'text-xs font-medium text-slate-500';
const cardClass = 'rounded-3xl bg-white shadow-sm border border-slate-100 p-5';

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
    </div>
);

const OwnerCreate: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        socialName: '',
        type: 'PF', // PF or PJ
        document: '', // CPF/CNPJ
        documentType: '', // RG/IE
        gender: '',
        nationality: '',
        birthDate: '',
        maritalStatus: '',
        profession: '',
        email: '',
        secondaryEmail: '',
        phone: '',
        whatsapp: '',
        website: '',

        // Address
        zipCode: '',
        address: '', // Street
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',

        // Spouse
        spouseName: '',
        spouseCpf: '',

        // Banking (OwnerProfile)
        bankName: '',
        agency: '',
        account: '',
        accountType: '',
        pixKey: '',
        pixType: '',
        payoutPreference: 'mensal', // mensal, por_recebimento
        adminFee: '', // Personal tax override
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Construct Payload
            const payload = {
                type: 'OWNER',
                name: formData.name,
                socialName: formData.socialName,
                document: formData.document,
                documentType: formData.documentType,
                gender: formData.gender,
                nationality: formData.nationality,
                birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
                maritalStatus: formData.maritalStatus,
                profession: formData.profession,
                email: formData.email,
                secondaryEmail: formData.secondaryEmail,
                phone: formData.phone,
                whatsapp: formData.whatsapp,
                website: formData.website,

                // Address flattening
                zipCode: formData.zipCode,
                street: formData.address, // mapping address -> street in schema if separate, currently schema has 'address' generic + specific fields. 
                // Schema update added: address (generic string) AND street, number etc.
                // We will save to specific fields. 
                address: `${formData.address}, ${formData.number} - ${formData.neighborhood}`, // Compound for compatibility
                number: formData.number,
                complement: formData.complement,
                neighborhood: formData.neighborhood,
                city: formData.city,
                state: formData.state,

                spouseName: formData.spouseName,
                spouseCpf: formData.spouseCpf,

                ownerProfile: {
                    bankName: formData.bankName,
                    agency: formData.agency,
                    account: formData.account,
                    accountType: formData.accountType,
                    pixKey: formData.pixKey,
                    pixType: formData.pixType,
                    payoutPreference: formData.payoutPreference,
                    adminFee: formData.adminFee ? Number(formData.adminFee) : undefined,
                }
            };

            await api.realEstate.persons.create(payload);
            navigate('/admin/gestao-imobiliaria/proprietarios');
        } catch (error) {
            console.error('Error creating owner:', error);
            alert('Erro ao salvar proprietario.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/gestao-imobiliaria/proprietarios')}
                    className="p-2 hover:bg-slate-100 rounded-full transition"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Novo Proprietario</h3>
                    <p className="text-sm text-gray-500">Cadastro completo de proprietario e dados bancarios.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Dados Pessoais */}
                <section className={cardClass}>
                    <SectionHeader title="Dados Pessoais" subtitle="Informacoes basicas de identificacao." />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Nome Completo *</label>
                            <input
                                className={inputClass}
                                required
                                value={formData.name}
                                onChange={e => updateField('name', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Tipo</label>
                            <select
                                className={inputClass}
                                value={formData.type}
                                onChange={e => updateField('type', e.target.value)}
                            >
                                <option value="PF">Pessoa Fisica</option>
                                <option value="PJ">Pessoa Juridica</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>CPF / CNPJ *</label>
                            <input
                                className={inputClass}
                                required
                                value={formData.document}
                                onChange={e => updateField('document', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>RG / Inscr. Estadual</label>
                            <input
                                className={inputClass}
                                value={formData.documentType}
                                onChange={e => updateField('documentType', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Data de Nascimento</label>
                            <input
                                type="date"
                                className={inputClass}
                                value={formData.birthDate}
                                onChange={e => updateField('birthDate', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Nacionalidade</label>
                            <input
                                className={inputClass}
                                value={formData.nationality}
                                onChange={e => updateField('nationality', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Estado Civil</label>
                            <select
                                className={inputClass}
                                value={formData.maritalStatus}
                                onChange={e => updateField('maritalStatus', e.target.value)}
                            >
                                <option value="">Selecione...</option>
                                <option value="solteiro">Solteiro(a)</option>
                                <option value="casado">Casado(a)</option>
                                <option value="divorciado">Divorciado(a)</option>
                                <option value="viuvo">Viuvo(a)</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Profissao</label>
                            <input
                                className={inputClass}
                                value={formData.profession}
                                onChange={e => updateField('profession', e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Contato e Endereço */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <section className={cardClass}>
                        <SectionHeader title="Contato" subtitle="Canais de comunicacao." />
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>E-mail Principal *</label>
                                <input
                                    type="email"
                                    className={inputClass}
                                    required
                                    value={formData.email}
                                    onChange={e => updateField('email', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>E-mail Secundario</label>
                                <input
                                    type="email"
                                    className={inputClass}
                                    value={formData.secondaryEmail}
                                    onChange={e => updateField('secondaryEmail', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Telefone</label>
                                    <input className={inputClass} value={formData.phone} onChange={e => updateField('phone', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelClass}>WhatsApp</label>
                                    <input className={inputClass} value={formData.whatsapp} onChange={e => updateField('whatsapp', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={cardClass}>
                        <SectionHeader title="Endereço" subtitle="Endereço residencial ou comercial." />
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>CEP</label>
                                    <input className={inputClass} value={formData.zipCode} onChange={e => updateField('zipCode', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelClass}>Cidade/UF</label>
                                    <div className="flex gap-2">
                                        <input className={inputClass} placeholder="Cidade" value={formData.city} onChange={e => updateField('city', e.target.value)} />
                                        <input className={`${inputClass} w-20`} placeholder="UF" value={formData.state} onChange={e => updateField('state', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Logradouro</label>
                                <input className={inputClass} value={formData.address} onChange={e => updateField('address', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Numero</label>
                                    <input className={inputClass} value={formData.number} onChange={e => updateField('number', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelClass}>Complemento</label>
                                    <input className={inputClass} value={formData.complement} onChange={e => updateField('complement', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Bairro</label>
                                <input className={inputClass} value={formData.neighborhood} onChange={e => updateField('neighborhood', e.target.value)} />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Dados Bancarios */}
                <section className={cardClass}>
                    <SectionHeader title="Dados Bancarios e Repasse" subtitle="Conta para recebimento dos alugueis." />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Banco</label>
                            <input className={inputClass} value={formData.bankName} onChange={e => updateField('bankName', e.target.value)} placeholder="Ex: Nubank" />
                        </div>
                        <div>
                            <label className={labelClass}>Agencia</label>
                            <input className={inputClass} value={formData.agency} onChange={e => updateField('agency', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Conta</label>
                            <input className={inputClass} value={formData.account} onChange={e => updateField('account', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Chave PIX</label>
                            <input className={inputClass} value={formData.pixKey} onChange={e => updateField('pixKey', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Tipo da Chave</label>
                            <select className={inputClass} value={formData.pixType} onChange={e => updateField('pixType', e.target.value)}>
                                <option value="">Selecione...</option>
                                <option value="cpf">CPF/CNPJ</option>
                                <option value="email">Email</option>
                                <option value="telefone">Telefone</option>
                                <option value="aleatoria">Aleatoria</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Preferencia de Repasse</label>
                            <select className={inputClass} value={formData.payoutPreference} onChange={e => updateField('payoutPreference', e.target.value)}>
                                <option value="mensal">Mensal (Data fixa)</option>
                                <option value="por_recebimento">Apos cada recebimento (D+X)</option>
                            </select>
                        </div>
                    </div>
                </section>

                {formData.maritalStatus === 'casado' && (
                    <section className={cardClass}>
                        <SectionHeader title="Conjuge" subtitle="Dados do conjuge para contratos." />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Nome do Conjuge</label>
                                <input className={inputClass} value={formData.spouseName} onChange={e => updateField('spouseName', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass}>CPF do Conjuge</label>
                                <input className={inputClass} value={formData.spouseCpf} onChange={e => updateField('spouseCpf', e.target.value)} />
                            </div>
                        </div>
                    </section>
                )}

                {/* Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 lg:pl-72 z-40 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/gestao-imobiliaria/proprietarios')}
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
                        {loading ? 'Salvando...' : 'Salvar Proprietario'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default OwnerCreate;
