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

const TenantCreate: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        socialName: '',
        type: 'PF',
        document: '', // CPF
        documentType: '', // RG
        gender: '',
        nationality: '',
        birthDate: '',
        maritalStatus: '',
        profession: '',
        income: '', // Stored in Person.income (float)

        email: '',
        secondaryEmail: '',
        phone: '',
        whatsapp: '',

        // Address
        zipCode: '',
        address: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',

        // Spouse
        spouseName: '',
        spouseCpf: '',

        // Professional / Tenant Profile
        employer: '',
        jobTitle: '',
        admissionDate: '',
        incomeProof: '', // URL placeholder

        // Analysis
        analysisStatus: 'pending',
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                type: 'TENANT',
                name: formData.name,
                socialName: formData.socialName,
                document: formData.document,
                documentType: formData.documentType,
                gender: formData.gender,
                nationality: formData.nationality,
                birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
                maritalStatus: formData.maritalStatus,
                profession: formData.profession,
                income: formData.income ? Number(formData.income) : undefined,

                email: formData.email,
                secondaryEmail: formData.secondaryEmail,
                phone: formData.phone,
                whatsapp: formData.whatsapp,

                // Address
                zipCode: formData.zipCode,
                street: formData.address,
                address: `${formData.address}, ${formData.number} - ${formData.neighborhood}`,
                number: formData.number,
                complement: formData.complement,
                neighborhood: formData.neighborhood,
                city: formData.city,
                state: formData.state,

                spouseName: formData.spouseName,
                spouseCpf: formData.spouseCpf,

                tenantProfile: {
                    employer: formData.employer,
                    jobTitle: formData.jobTitle,
                    admissionDate: formData.admissionDate ? new Date(formData.admissionDate) : undefined,
                    analysisStatus: formData.analysisStatus,
                    // incomeProof upload logic would go here
                }
            };

            await api.realEstate.persons.create(payload);
            navigate('/admin/gestao-imobiliaria/moradores');
        } catch (error) {
            console.error('Error creating tenant:', error);
            alert('Erro ao salvar inquilino.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/gestao-imobiliaria/moradores')}
                    className="p-2 hover:bg-slate-100 rounded-full transition"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Novo Inquilino</h3>
                    <p className="text-sm text-gray-500">Cadastro de inquilino para analise e contrato.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Dados Pessoais */}
                <section className={cardClass}>
                    <SectionHeader title="Dados Pessoais" subtitle="Identificacao do inquilino." />
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
                            <label className={labelClass}>Nome Social</label>
                            <input
                                className={inputClass}
                                value={formData.socialName}
                                onChange={e => updateField('socialName', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>CPF *</label>
                            <input
                                className={inputClass}
                                required
                                value={formData.document}
                                onChange={e => updateField('document', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>RG</label>
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
                    </div>
                </section>

                {/* Contato/Endereço */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <section className={cardClass}>
                        <SectionHeader title="Contato" />
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>E-mail Principal *</label>
                                <input type="email" className={inputClass} required value={formData.email} onChange={e => updateField('email', e.target.value)} />
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
                        <SectionHeader title="Endereço Atual" />
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
                        </div>
                    </section>
                </div>

                {/* Profissional */}
                <section className={cardClass}>
                    <SectionHeader title="Dados Profissionais" subtitle="Para analise de credito." />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Profissao</label>
                            <input className={inputClass} value={formData.profession} onChange={e => updateField('profession', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Empresa (Empregador)</label>
                            <input className={inputClass} value={formData.employer} onChange={e => updateField('employer', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Cargo</label>
                            <input className={inputClass} value={formData.jobTitle} onChange={e => updateField('jobTitle', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Renda Mensal (R$)</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={formData.income}
                                onChange={e => updateField('income', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Data Admissao</label>
                            <input
                                type="date"
                                className={inputClass}
                                value={formData.admissionDate}
                                onChange={e => updateField('admissionDate', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Status Analise</label>
                            <select className={inputClass} value={formData.analysisStatus} onChange={e => updateField('analysisStatus', e.target.value)}>
                                <option value="pending">Pendente</option>
                                <option value="approved">Aprovado</option>
                                <option value="rejected">Reprovado</option>
                            </select>
                        </div>
                    </div>
                </section>

                {formData.maritalStatus === 'casado' && (
                    <section className={cardClass}>
                        <SectionHeader title="Conjuge" />
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
                        onClick={() => navigate('/admin/gestao-imobiliaria/moradores')}
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
                        {loading ? 'Salvando...' : 'Salvar Inquilino'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TenantCreate;
