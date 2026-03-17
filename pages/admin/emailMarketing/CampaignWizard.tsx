import React, { useState, useEffect } from 'react';
import {
    ChevronLeft, Check, User, Users, Clock, Layout, Play, Filter, List, Plus
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';

const CampaignWizard: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // For edit mode
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [lists, setLists] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);

    // Form Data State
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        senderName: '',
        senderEmail: '',
        replyTo: '',
        targetType: 'lists', // lists, segment, all
        selectedLists: [] as string[],
        selectedSegmentId: '',
        templateId: '',
        emailContent: '', // HTML content
        scheduledAt: '',
        status: 'draft'
    });

    useEffect(() => {
        // Load lists and templates
        const loadResources = async () => {
            try {
                const [listsData, templatesData] = await Promise.all([
                    api.email.getLists(),
                    api.email.getTemplates()
                ]);
                setLists(listsData);
                setTemplates(templatesData);
            } catch (error) {
                console.error('Erro ao carregar recursos:', error);
            }
        };

        loadResources();

        // Load campaign if editing
        if (id) {
            loadCampaign(id);
        }
    }, [id]);

    const loadCampaign = async (campaignId: string) => {
        setLoading(true);
        try {
            const campaign = await api.email.getCampaignById(campaignId);
            setFormData({
                name: campaign.name,
                subject: campaign.subject,
                senderName: campaign.senderName,
                senderEmail: campaign.senderEmail,
                replyTo: campaign.replyTo,
                targetType: campaign.targetType || 'lists',
                selectedLists: [], // TODO: map from campaign.recipients or stored connection
                selectedSegmentId: campaign.segmentId || '',
                templateId: campaign.templateId || '',
                emailContent: campaign.htmlContent || '',
                scheduledAt: campaign.scheduledAt || '',
                status: campaign.status
            });
        } catch (error) {
            console.error('Erro ao carregar campanha:', error);
            alert('Erro ao carregar campanha');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentStep < 5) setCurrentStep(currentStep + 1);
        if (currentStep === 5) {
            handleSend();
        }
    };


    const handleSaveDraft = async () => {
        setLoading(true);
        try {
            const payload = { ...formData, status: 'draft' };
            if (id) {
                await api.email.updateCampaign(id, payload);
            } else {
                await api.email.createCampaign(payload);
            }
            alert('Rascunho salvo com sucesso!');
            navigate('/admin/email-marketing/campaigns');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar rascunho.');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!confirm('Deseja realmente enviar/agendar esta campanha?')) return;

        setLoading(true);
        try {
            let campaignId = id;
            const payload = { ...formData }; // Status will be updated by sendCampaign endpoint or logic

            if (!campaignId) {
                const newCampaign = await api.email.createCampaign(payload);
                campaignId = newCampaign.id;
            } else {
                await api.email.updateCampaign(campaignId, payload);
            }

            await api.email.sendCampaign(campaignId!, { scheduledAt: formData.scheduledAt });

            alert('Campanha enviada/agendada com sucesso!');
            navigate('/admin/email-marketing/campaigns');
        } catch (error) {
            console.error('Erro ao enviar:', error);
            alert('Erro ao enviar campanha.');
        } finally {
            setLoading(false);
        }
    };

    const toggleListSelection = (listId: string) => {
        setFormData(prev => {
            const isSelected = prev.selectedLists.includes(listId);
            return {
                ...prev,
                selectedLists: isSelected
                    ? prev.selectedLists.filter(id => id !== listId)
                    : [...prev.selectedLists, listId]
            };
        });
    };

    const steps = [
        { number: 1, label: 'Informações', icon: User },
        { number: 2, label: 'Público', icon: Users },
        { number: 3, label: 'Design', icon: Layout },
        { number: 4, label: 'Envio', icon: Clock },
        { number: 5, label: 'Revisão', icon: Check }
    ];

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Campanha</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                placeholder="Ex: Lançamento Verão 2025"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">Nome interno para sua organização.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assunto do Email</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                placeholder="Ex: Você não pode perder esta oportunidade!"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Remetente</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="Ex: Ivillar Imóveis"
                                    value={formData.senderName}
                                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email do Remetente</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="noreply@ivillar.com"
                                    value={formData.senderEmail}
                                    onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Quem deve receber este email?</h3>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <button
                                onClick={() => setFormData({ ...formData, targetType: 'lists' })}
                                className={`p-4 border-2 rounded-lg text-left transition-all ${formData.targetType === 'lists'
                                    ? 'border-brand-600 bg-brand-50'
                                    : 'border-gray-200 hover:border-brand-200'
                                    }`}
                            >
                                <List className={`w-6 h-6 mb-2 ${formData.targetType === 'lists' ? 'text-brand-600' : 'text-gray-400'}`} />
                                <p className={`font-semibold ${formData.targetType === 'lists' ? 'text-brand-700' : 'text-gray-700'}`}>Listas de Email</p>
                            </button>

                            <button
                                onClick={() => setFormData({ ...formData, targetType: 'segment' })}
                                className={`p-4 border-2 rounded-lg text-left transition-all ${formData.targetType === 'segment'
                                    ? 'border-brand-600 bg-brand-50'
                                    : 'border-gray-200 hover:border-brand-200'
                                    }`}
                            >
                                <Filter className={`w-6 h-6 mb-2 ${formData.targetType === 'segment' ? 'text-brand-600' : 'text-gray-400'}`} />
                                <p className={`font-semibold ${formData.targetType === 'segment' ? 'text-brand-700' : 'text-gray-700'}`}>Segmento Dinâmico</p>
                            </button>
                        </div>

                        {formData.targetType === 'lists' && (
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                    <h4 className="font-medium text-gray-700">Minhas Listas</h4>
                                    <button className="text-brand-600 text-sm font-medium hover:underline flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Nova Lista
                                    </button>
                                </div>
                                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                                    {lists.length === 0 && <p className="p-4 text-center text-gray-500">Nenhuma lista encontrada.</p>}
                                    {lists.map(list => (
                                        <div
                                            key={list.id}
                                            className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                                            onClick={() => toggleListSelection(list.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.selectedLists.includes(list.id)
                                                    ? 'bg-brand-600 border-brand-600'
                                                    : 'border-gray-300'
                                                    }`}>
                                                    {formData.selectedLists.includes(list.id) && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <div>
                                                    <p className="text-gray-900 font-medium">{list.name}</p>
                                                    <p className="text-xs text-gray-500">{list.count || 0} contatos</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {formData.targetType === 'segment' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                                <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600">O construtor de segmentos está em desenvolvimento.</p>
                            </div>
                        )}
                    </div>
                );
            case 3:
                return (
                    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {!formData.templateId ? (
                            <>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Escolha um Template</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {templates.map(template => (
                                        <div
                                            key={template.id}
                                            onClick={() => setFormData({ ...formData, templateId: template.id })}
                                            className="group cursor-pointer"
                                        >
                                            <div className={`aspect-[3/4] rounded-xl border-2 border-gray-200 group-hover:border-brand-500 overflow-hidden relative transition-all shadow-sm group-hover:shadow-md bg-gray-50`}>
                                                {/* Thumbnail logic would go here */}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5">
                                                    <span className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium shadow-sm">
                                                        Selecionar
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="mt-3 text-center font-medium text-gray-900 group-hover:text-brand-600 transition-colors">
                                                {template.name}
                                            </p>
                                        </div>
                                    ))}
                                    <div
                                        className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50 transition-all cursor-pointer"
                                        onClick={() => setFormData({ ...formData, templateId: 'custom' })}
                                    >
                                        <Plus className="w-8 h-8 mb-2" />
                                        <span className="font-medium">Começar do Zero</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-[600px] border border-gray-200 rounded-xl overflow-hidden flex">
                                {/* Simple Editor Mock */}
                                <div className="w-64 border-r border-gray-200 bg-gray-50 p-4">
                                    <button
                                        onClick={() => setFormData({ ...formData, templateId: '' })}
                                        className="mb-4 text-xs text-gray-500 flex items-center gap-1 hover:text-gray-900"
                                    >
                                        <ChevronLeft className="w-3 h-3" /> Trocar Template
                                    </button>
                                    <h4 className="font-semibold text-gray-700 mb-4">Blocos</h4>
                                    <p className="text-xs text-gray-400">Editor visual (Mock)</p>
                                </div>
                                <div className="flex-1 bg-gray-100 p-8 flex justify-center overflow-y-auto">
                                    <div className="bg-white shadow p-8 w-full max-w-lg">
                                        <h1 className="text-2xl font-bold">Conteúdo do Email</h1>
                                        <p className="text-gray-500 mt-4">Este é apenas um placeholder para o editor real.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 4:
                return (
                    <div className="max-w-2xl mx-auto text-center py-10">
                        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Agendamento</h3>
                        <p className="text-gray-500 mb-6">Quando você quer enviar esta campanha?</p>

                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                            <button
                                onClick={() => setFormData({ ...formData, scheduledAt: '' })}
                                className={`p-4 border-2 rounded-lg ${!formData.scheduledAt ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}
                            >
                                <p className="font-bold text-brand-700">Enviar Agora</p>
                                <p className="text-xs text-brand-600 mt-1">Assim que aprovado</p>
                            </button>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    className={`absolute inset-0 opacity-0 cursor-pointer w-full h-full`}
                                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                />
                                <button className={`w-full h-full p-4 border-2 rounded-lg text-left ${formData.scheduledAt ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}>
                                    <p className="font-bold text-gray-700">Agendar</p>
                                    <p className="text-xs text-gray-500 mt-1">{formData.scheduledAt ? new Date(formData.scheduledAt).toLocaleString() : 'Data e hora específica'}</p>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="max-w-2xl mx-auto py-6">
                        <div className="bg-white border card-border rounded-xl p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Resumo da Campanha</h3>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-500">Nome</p>
                                    <p className="font-medium">{formData.name || 'Sem nome'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Assunto</p>
                                    <p className="font-medium">{formData.subject || 'Sem assunto'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Público</p>
                                    <p className="font-medium">
                                        {formData.targetType === 'lists'
                                            ? `${formData.selectedLists.length} listas selecionadas`
                                            : 'Segmento Dinâmico'
                                        }
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Envio</p>
                                    <p className="font-medium">{formData.scheduledAt ? new Date(formData.scheduledAt).toLocaleString() : 'Imediato'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/email-marketing/campaigns')}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">{id ? 'Editar Campanha' : 'Nova Campanha'}</h1>
                        <p className="text-xs text-gray-500">Passo {currentStep} de 5</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSaveDraft}
                        disabled={loading}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium shadow-sm flex items-center gap-2"
                    >
                        {currentStep === 5 ? (loading ? 'Enviando...' : 'Enviar Campanha') : 'Próximo'}
                        {currentStep === 5 ? <Play className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4 rotate-180" />}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <aside className="w-64 bg-white border-r border-gray-200 hidden lg:block p-6">
                    <nav className="space-y-1">
                        {steps.map((step) => (
                            <button
                                key={step.number}
                                onClick={() => setCurrentStep(step.number)}
                                disabled={step.number > currentStep && formData.name === ''}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${currentStep === step.number
                                    ? 'bg-brand-50 text-brand-700'
                                    : currentStep > step.number
                                        ? 'text-green-600 hover:bg-gray-50'
                                        : 'text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === step.number
                                    ? 'border-brand-600 bg-white text-brand-600'
                                    : currentStep > step.number
                                        ? 'border-green-500 bg-green-500 text-white'
                                        : 'border-gray-200 text-gray-400'
                                    }`}>
                                    {currentStep > step.number ? <Check className="w-4 h-4" /> : step.number}
                                </div>
                                <span>{step.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] p-6">
                        {renderStepContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CampaignWizard;
