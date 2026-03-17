
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { PersonPicker } from './components/PersonPicker';
import { OwnerFormDrawer } from './components/OwnerFormDrawer';
import { TenantFormDrawer } from './components/TenantFormDrawer';
import { GuarantorFormDrawer } from './components/GuarantorFormDrawer';
import PropertyPicker from '../../../components/realEstate/PropertyPicker';
import { api } from '../../../services/api';

const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all';
const labelClass = 'text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block';
const cardClass = 'bg-white rounded-3xl shadow-sm border border-slate-100 p-6';
const sectionTitleClass = 'text-base font-bold text-gray-900';
const sectionSubtitleClass = 'text-sm text-slate-500 mt-0.5 mb-6';

const ContractWizard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Drawers State
    const [showOwnerDrawer, setShowOwnerDrawer] = useState(false);
    const [showTenantDrawer, setShowTenantDrawer] = useState(false);
    const [showGuarantorDrawer, setShowGuarantorDrawer] = useState(false);

    // Contract Data State
    const [data, setData] = useState({
        property: null as any,
        owners: [] as any[],
        tenants: [] as any[],
        guarantee: { type: 'NONE', value: '', details: '', guarantorId: '' },
        financial: {
            startDate: '',
            endDate: '',
            duration: 12,
            rentValue: '',
            condoValue: '',
            iptuValue: '',
            dayDue: 5,
        },
        status: 'draft',
        observations: ''
    });

    const updateFinancial = (field: keyof typeof data.financial, value: any) => {
        setData(prev => ({ ...prev, financial: { ...prev.financial, [field]: value } }));
    };

    const handlePropertySelect = (property: any) => {
        if (property.status === 'occupied') {
            if (!confirm('Este imovel consta como OCUPADO. Deseja continuar mesmo assim?')) return;
        }
        setData(prev => ({
            ...prev,
            property,
            financial: {
                ...prev.financial,
                rentValue: property.rent || prev.financial.rentValue
            }
        }));
    };

    const handleAddOwner = (personId: string, person?: any) => {
        if (!personId) {
            setData(prev => ({ ...prev, owners: [] }));
            return;
        }
        setData(prev => ({ ...prev, owners: [{ person, share: 100 }] }));
    };

    const handleAddTenant = (personId: string, person?: any) => {
        if (!personId) {
            setData(prev => ({ ...prev, tenants: [] }));
            return;
        }
        setData(prev => ({ ...prev, tenants: [{ person }] }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                propertyId: data.property?.id,
                ownerId: data.owners[0]?.person?.id,
                tenantPersonId: data.tenants[0]?.person?.id,
                tenantId: 'default-tenant-id',
                startDate: data.financial.startDate,
                endDate: data.financial.endDate,
                rentValue: data.financial.rentValue,
                term_months: data.financial.duration,
                due_day: data.financial.dayDue,
                condo_amount: data.financial.condoValue,
                iptu_amount: data.financial.iptuValue,
                guaranteeType: data.guarantee.type,
                guaranteeValue: data.guarantee.value,
            };

            await api.realEstate.contracts.create(payload);
            navigate('/admin/gestao-imobiliaria/contratos');
        } catch (error) {
            console.error(error);
            alert('Erro ao criar contrato');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-2 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Voltar
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Novo Contrato</h1>
                    <p className="text-sm text-slate-500">Preencha os dados para gerar um novo contrato de locacao.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 shadow-lg shadow-brand-600/20 flex items-center gap-2 transition"
                    >
                        <Save className="w-4 h-4" /> Criar Contrato
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
                {/* Main Column */}
                <div className="space-y-8">

                    {/* Imovel Selection */}
                    <section className={cardClass}>
                        <div className="mb-6">
                            <h3 className={sectionTitleClass}>Imovel</h3>
                            <p className={sectionSubtitleClass}>Selecione o imovel objeto deste contrato.</p>
                        </div>
                        <PropertyPicker onSelect={handlePropertySelect} />
                        {data.property && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <h4 className="font-semibold text-slate-900">{data.property.title}</h4>
                                <p className="text-sm text-slate-600">{data.property.address}</p>
                                <div className="flex gap-4 mt-2 text-xs">
                                    <span className="px-2 py-1 bg-white border border-slate-200 rounded-md">Tipo: {data.property.type}</span>
                                    <span className={`px-2 py-1 rounded-md ${data.property.status === 'occupied' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                        Status: {data.property.status}
                                    </span>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Financial Conditions */}
                    <section className={cardClass}>
                        <div className="mb-6">
                            <h3 className={sectionTitleClass}>Condicoes Financeiras</h3>
                            <p className={sectionSubtitleClass}>Valores e prazos do contrato.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div>
                                <label className={labelClass}>Aluguel Mensal (R$)</label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    value={data.financial.rentValue}
                                    onChange={e => updateFinancial('rentValue', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Dia Vencimento</label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    max={31} min={1}
                                    value={data.financial.dayDue}
                                    onChange={e => updateFinancial('dayDue', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Prazo (Meses)</label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    value={data.financial.duration}
                                    onChange={e => updateFinancial('duration', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Inicio Vigencia</label>
                                <input
                                    type="date"
                                    className={inputClass}
                                    value={data.financial.startDate}
                                    onChange={e => updateFinancial('startDate', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Fim Vigencia</label>
                                <input
                                    type="date"
                                    className={inputClass}
                                    value={data.financial.endDate}
                                    onChange={e => updateFinancial('endDate', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Condominio (Estimado R$)</label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    value={data.financial.condoValue}
                                    onChange={e => updateFinancial('condoValue', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>IPTU (Mensal R$)</label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    value={data.financial.iptuValue}
                                    onChange={e => updateFinancial('iptuValue', e.target.value)}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Guarantee */}
                    <section className={cardClass}>
                        <div className="mb-6">
                            <h3 className={sectionTitleClass}>Garantia</h3>
                            <p className={sectionSubtitleClass}>Modalidade de garantia locaticia.</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                            {['NONE', 'CAUTION', 'GUARANTOR', 'INSURANCE', 'CAPITALIZATION'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setData(prev => ({ ...prev, guarantee: { ...prev.guarantee, type } }))}
                                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${data.guarantee.type === type ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {data.guarantee.type === 'GUARANTOR' && (
                            <PersonPicker
                                type="GUARANTOR"
                                value={data.guarantee.guarantorId}
                                onChange={(id) => setData(prev => ({ ...prev, guarantee: { ...prev.guarantee, guarantorId: id } }))}
                                label="Selecionar Fiador"
                                onAddNew={() => setShowGuarantorDrawer(true)}
                            />
                        )}

                        {data.guarantee.type === 'CAUTION' && (
                            <div>
                                <label className={labelClass}>Valor Caucao (R$)</label>
                                <input
                                    className={inputClass}
                                    type="number"
                                    value={data.guarantee.value}
                                    onChange={e => setData(prev => ({ ...prev, guarantee: { ...prev.guarantee, value: e.target.value } }))}
                                />
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Owner */}
                    <section className={cardClass}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-900">Proprietario</h3>
                            <button className="text-xs text-brand-600 font-semibold hover:underline" onClick={() => setShowOwnerDrawer(true)}>
                                + Novo
                            </button>
                        </div>
                        <PersonPicker
                            type="OWNER"
                            value={data.owners[0]?.person?.id}
                            onChange={handleAddOwner}
                            label="Selecionar Proprietario"
                            onAddNew={() => setShowOwnerDrawer(true)}
                        />
                    </section>

                    {/* Tenant */}
                    <section className={cardClass}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-900">Inquilino</h3>
                            <button className="text-xs text-brand-600 font-semibold hover:underline" onClick={() => setShowTenantDrawer(true)}>
                                + Novo
                            </button>
                        </div>
                        <PersonPicker
                            type="TENANT"
                            value={data.tenants[0]?.person?.id}
                            onChange={handleAddTenant}
                            label="Selecionar Inquilino"
                            onAddNew={() => setShowTenantDrawer(true)}
                        />
                    </section>

                    {/* Observations */}
                    <section className={cardClass}>
                        <h3 className="font-semibold text-gray-900 mb-4">Observacoes</h3>
                        <textarea
                            className={`${inputClass} min-h-[100px]`}
                            value={data.observations}
                            onChange={e => setData(prev => ({ ...prev, observations: e.target.value }))}
                            placeholder="Anotacoes internas..."
                        />
                    </section>
                </div>
            </div>

            {/* Drawers */}
            <OwnerFormDrawer isOpen={showOwnerDrawer} onClose={() => setShowOwnerDrawer(false)} onSuccess={(id, p) => handleAddOwner(id, p)} />
            <TenantFormDrawer isOpen={showTenantDrawer} onClose={() => setShowTenantDrawer(false)} onSuccess={(id, p) => handleAddTenant(id, p)} />
            <GuarantorFormDrawer isOpen={showGuarantorDrawer} onClose={() => setShowGuarantorDrawer(false)} onSuccess={(id) => setData(prev => ({ ...prev, guarantee: { ...prev.guarantee, guarantorId: id } }))} />
        </div>
    );
};

export default ContractWizard;
