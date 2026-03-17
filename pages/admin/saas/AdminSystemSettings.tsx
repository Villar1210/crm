import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Monitor, Smartphone, Check, Grid, Bot, Zap, Database, Trash2, AlertTriangle, X, Rocket, LayoutList, Users } from 'lucide-react';
import { api } from '../../../services/api';

const AdminSystemSettings: React.FC = () => {
    const { scale, setScale } = useTheme();
    const [tempScale, setTempScale] = React.useState(scale);
    const [saved, setSaved] = React.useState(false);

    // Automation Settings State
    const [automationEnabled, setAutomationEnabled] = React.useState(false);
    const [massSenderEnabled, setMassSenderEnabled] = React.useState(false);
    const [leadRouletteEnabled, setLeadRouletteEnabled] = React.useState(false);
    const [signatureProvider, setSignatureProvider] = React.useState<'docusign' | 'd4sign'>('docusign');

    const [stagnancyDays, setStagnancyDays] = React.useState(3);

    // Database Reset State
    const [showResetModal, setShowResetModal] = React.useState(false);
    const [resetType, setResetType] = React.useState<'production' | 'development' | null>(null);
    const [resetPassword, setResetPassword] = React.useState('');
    const [isResetting, setIsResetting] = React.useState(false);

    React.useEffect(() => {
        setTempScale(scale);

        // Load CRM Settings
        const savedSettings = localStorage.getItem('crm_settings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setAutomationEnabled(parsed.enableAutomations ?? false);
            setStagnancyDays(parsed.automationStagnancyDays ?? 3);
            setMassSenderEnabled(parsed.enableMassSender ?? false);
            setLeadRouletteEnabled(parsed.enableLeadRoulette ?? false);
            setSignatureProvider(parsed.signatureProvider ?? 'docusign');
        }
    }, [scale]);


    const handleSave = () => {
        setScale(tempScale);

        // Save CRM Settings (Preserving other settings)
        const existingSettings = JSON.parse(localStorage.getItem('crm_settings') || '{}');
        localStorage.setItem('crm_settings', JSON.stringify({
            ...existingSettings,
            enableAutomations: automationEnabled,
            automationStagnancyDays: stagnancyDays,
            enableMassSender: massSenderEnabled,
            enableLeadRoulette: leadRouletteEnabled,
            signatureProvider: signatureProvider
        }));

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleResetClick = (type: 'production' | 'development') => {
        setResetType(type);
        setResetPassword('');
        setShowResetModal(true);
    };

    const confirmReset = async () => {
        if (!resetType) return;

        setIsResetting(true);
        try {
            await api.system.resetDatabase(resetPassword, resetType);
            alert('Banco de dados limpo com sucesso!');
            setShowResetModal(false);
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Erro ao limpar banco de dados. Verifique a senha.');
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
                <p className="text-gray-500">Ajustes globais de aparência, comportamento e personalização.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[600px]">
                <div className="p-6">
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <Monitor className="w-5 h-5 text-brand-600" />
                                Escala da Interface
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Default Option */}
                                <button
                                    onClick={() => setTempScale('default')}
                                    className={`relative flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${tempScale === 'default'
                                        ? 'border-brand-600 bg-brand-50'
                                        : 'border-gray-200 hover:border-brand-200 hover:bg-white'
                                        }`}
                                >
                                    <div className={`p-3 rounded-lg ${tempScale === 'default' ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500'}`}>
                                        <Monitor className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`font-bold ${tempScale === 'default' ? 'text-brand-900' : 'text-gray-900'}`}>Padrão (100%)</span>
                                            {tempScale === 'default' && <Check className="w-5 h-5 text-brand-600" />}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Tamanho original dos elementos.
                                        </p>
                                    </div>
                                </button>

                                {/* Compact Option */}
                                <button
                                    onClick={() => setTempScale('compact')}
                                    className={`relative flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${tempScale === 'compact'
                                        ? 'border-brand-600 bg-brand-50'
                                        : 'border-gray-200 hover:border-brand-200 hover:bg-white'
                                        }`}
                                >
                                    <div className={`p-3 rounded-lg ${tempScale === 'compact' ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500'}`}>
                                        <Smartphone className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`font-bold ${tempScale === 'default' ? 'text-brand-900' : 'text-gray-900'}`}>Compacto (87.5%)</span>
                                            {tempScale === 'compact' && <Check className="w-5 h-5 text-brand-600" />}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Reduz o tamanho para exibir mais conteúdo.
                                        </p>
                                    </div>
                                </button>

                                {/* Ultra Compact Option */}
                                <button
                                    onClick={() => setTempScale('ultra-compact')}
                                    className={`relative flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${tempScale === 'ultra-compact'
                                        ? 'border-brand-600 bg-brand-50'
                                        : 'border-gray-200 hover:border-brand-200 hover:bg-white'
                                        }`}
                                >
                                    <div className={`p-3 rounded-lg ${tempScale === 'ultra-compact' ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500'}`}>
                                        <Grid className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`font-bold ${tempScale === 'default' ? 'text-brand-900' : 'text-gray-900'}`}>Ultra (75%)</span>
                                            {tempScale === 'ultra-compact' && <Check className="w-5 h-5 text-brand-600" />}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Escala máxima para alta densidade (12px).
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <Bot className="w-5 h-5 text-brand-600" />
                                Automações e Inteligência
                            </h2>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${automationEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                            <Zap className="w-6 h-6" fill={automationEnabled ? "currentColor" : "none"} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">Sugestões de Follow-up</h3>
                                            <p className="text-sm text-gray-500">Habilita botão de automações e alertas de estagnação no card do cliente.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={automationEnabled} onChange={(e) => setAutomationEnabled(e.target.checked)} className="sr-only peer" />
                                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                                    </label>
                                </div>

                                <div className={`transition-all duration-300 ${automationEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Considerar "Lead Parado" após:</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={stagnancyDays}
                                            onChange={(e) => setStagnancyDays(parseInt(e.target.value) || 3)}
                                            className="w-24 p-3 border border-gray-300 rounded-xl font-bold text-center text-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                                        />
                                        <span className="text-gray-500 font-medium">dias sem interação</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CRM Modules Settings */}
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <LayoutList className="w-5 h-5 text-brand-600" />
                                Módulos do CRM
                            </h2>
                            <div className="space-y-4">
                                {/* Mass Sender Toggle */}
                                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${massSenderEnabled ? 'bg-brand-100 text-brand-600' : 'bg-gray-200 text-gray-500'}`}>
                                            <Rocket className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">Disparos em Massa</h3>
                                            <p className="text-sm text-gray-500">Habilita a aba de disparos em massa no CRM.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={massSenderEnabled} onChange={(e) => setMassSenderEnabled(e.target.checked)} className="sr-only peer" />
                                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-600"></div>
                                    </label>
                                </div>

                                {/* Lead Roulette Toggle */}
                                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${leadRouletteEnabled ? 'bg-brand-100 text-brand-600' : 'bg-gray-200 text-gray-500'}`}>
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">Distribuição de Leads</h3>
                                            <p className="text-sm text-gray-500">Habilita a aba de roleta/distribuição de leads no CRM.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={leadRouletteEnabled} onChange={(e) => setLeadRouletteEnabled(e.target.checked)} className="sr-only peer" />
                                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Signature Settings */}
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <LayoutList className="w-5 h-5 text-brand-600" />
                                Assinatura Eletrônica
                            </h2>
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Provedor Padrão de Assinaturas</label>
                                <select
                                    value={signatureProvider}
                                    onChange={(e) => setSignatureProvider(e.target.value as 'docusign' | 'd4sign')}
                                    className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                                >
                                    <option value="docusign">DocuSign</option>
                                    <option value="d4sign">D4Sign</option>
                                </select>
                                <p className="text-sm text-gray-500 mt-2">Escolha qual interface e motor de assinaturas carregar na plataforma.</p>
                            </div>
                        </div>

                        {/* Database Settings */}
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <Database className="w-5 h-5 text-brand-600" />
                                Banco de Dados
                            </h2>
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="p-3 rounded-lg bg-red-50 text-red-600">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Zona de Perigo</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            As ações abaixo removem permanentemente dados do sistema.
                                            <br />
                                            <strong>Nota:</strong> Usuários e Templates de Email serão preservados para evitar bloqueio.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleResetClick('production')}
                                        className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-red-100 bg-red-50 text-red-700 font-bold hover:bg-red-100 hover:border-red-200 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        Limpar Banco de Produção
                                    </button>
                                    <button
                                        onClick={() => handleResetClick('development')}
                                        className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-orange-100 bg-orange-50 text-orange-700 font-bold hover:bg-orange-100 hover:border-orange-200 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        Limpar Banco de Desenvolvimento
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all bg-brand-900 text-white hover:bg-brand-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                {saved ? (
                                    <>
                                        <Check className="w-5 h-5" /> Salvo!
                                    </>
                                ) : (
                                    <>
                                        Salvar Alterações
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>


            {/* Reset Confirmation Modal */}
            {
                showResetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    Confirmar Limpeza
                                </h3>
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="p-4 bg-red-50 rounded-xl text-red-700 text-sm">
                                    Você está prestes a apagar <strong>TODOS</strong> os dados do banco
                                    de <strong>{resetType === 'production' ? 'Produção' : 'Desenvolvimento'}</strong>.
                                    <br />
                                    Esta ação não pode ser desfeita.
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Digite a senha de administrador para confirmar:
                                    </label>
                                    <input
                                        type="password"
                                        value={resetPassword}
                                        onChange={(e) => setResetPassword(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                                        placeholder="Senha de admin..."
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="p-6 pt-0 flex gap-3">
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmReset}
                                    disabled={isResetting || !resetPassword}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isResetting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Limpando...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Confirmar Limpeza
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminSystemSettings;
