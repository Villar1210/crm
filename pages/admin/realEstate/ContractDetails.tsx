
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, User, Building2, CheckCircle, AlertTriangle, Printer } from 'lucide-react';
import { api } from '../../../services/api';

const ContractDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchContract = async () => {
            try {
                const data = await api.realEstate.contracts.getById(id!);
                setContract(data);
            } catch (error) {
                console.error(error);
                // Handle not found
            } finally {
                setLoading(false);
            }
        };
        fetchContract();
    }, [id]);

    const handleActivate = async () => {
        if (!confirm('Deseja ativar este contrato? Isso mudara o status imovel e gerara faturas.')) return;
        try {
            await api.realEstate.contracts.activate(id!);
            setContract({ ...contract, status: 'active' }); // Optimistic update or refetch
            // Refetch to get invoices
            const updated = await api.realEstate.contracts.getById(id!);
            setContract(updated);
        } catch (err) {
            console.error(err);
            alert('Erro ao ativar');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;
    if (!contract) return <div className="p-8 text-center">Contrato nao encontrado.</div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700';
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'ended': return 'bg-gray-100 text-gray-700';
            case 'draft': return 'bg-blue-100 text-blue-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/gestao-imobiliaria/contratos')} className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">Contrato #{contract.id.slice(0, 8)}</h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(contract.status)}`}>
                                {contract.status.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {contract.property?.title} - {contract.property?.address}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 border rounded-xl text-slate-600 font-semibold text-sm flex items-center gap-2 hover:bg-slate-50">
                        <Printer className="w-4 h-4" /> Imprimir
                    </button>
                    {contract.status === 'draft' && (
                        <button
                            onClick={handleActivate}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-emerald-700">
                            <CheckCircle className="w-4 h-4" /> Ativar Contrato
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex gap-6">
                    {['overview', 'financial', 'documents', 'history'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm font-medium border-b-2 transition ${activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left/Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'overview' && (
                        <>
                            {/* Parties */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-brand-500" /> Envolvidos
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Locador(es)</p>
                                        {contract.parties?.filter((p: any) => p.role === 'OWNER').map((p: any) => (
                                            <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {p.person.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900">{p.person.name}</p>
                                                    <p className="text-xs text-slate-500">{p.person.document}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Locatario(s)</p>
                                        {contract.parties?.filter((p: any) => p.role === 'TENANT').map((p: any) => (
                                            <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                                                    {p.person.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900">{p.person.name}</p>
                                                    <p className="text-xs text-slate-500">{p.person.document}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-brand-500" /> Prazos e Condicoes
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500">Inicio</p>
                                        <p className="font-medium text-gray-900">{new Date(contract.startDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Fim</p>
                                        <p className="font-medium text-gray-900">{new Date(contract.endDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Duracao</p>
                                        <p className="font-medium text-gray-900">{contract.durationMonths} meses</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Reajuste</p>
                                        <p className="font-medium text-gray-900">{contract.readjustmentIndex}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'financial' && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-brand-500" /> Financeiro
                            </h3>
                            {/* Invoices List */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="p-3 rounded-l-lg">Vencimento</th>
                                            <th className="p-3">Valor</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3 rounded-r-lg">Acoes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {contract.invoices?.length > 0 ? contract.invoices.map((inv: any) => (
                                            <tr key={inv.id}>
                                                <td className="p-3">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                                <td className="p-3">R$ {inv.amountTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-brand-600 hover:underline cursor-pointer">Detalhes</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-slate-500">Nenhuma fatura gerada ainda.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column / Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-3">Resumo Financeiro</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Aluguel</span>
                                <span className="font-medium">R$ {contract.rentValue}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Condominio</span>
                                <span className="font-medium">R$ {contract.condoValue || '0,00'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">IPTU</span>
                                <span className="font-medium">R$ {contract.iptuValue || '0,00'}</span>
                            </div>
                            <div className="h-px bg-slate-100 my-2" />
                            <div className="flex justify-between items-center text-base font-bold text-gray-900">
                                <span>Total Mensal</span>
                                <span>R$ {(contract.rentValue + (contract.condoValue || 0) + (contract.iptuValue || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100">
                        <h3 className="font-semibold text-brand-900 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Garantia
                        </h3>
                        <p className="text-sm text-brand-800 mb-1">Tipo: <strong>{contract.guaranteeType}</strong></p>
                        <p className="text-sm text-brand-800">Valor: R$ {contract.guaranteeValue || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractDetails;
