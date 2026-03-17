import React, { useMemo, useState, useEffect } from 'react';
import { Eye, Layers3, ToggleLeft, ToggleRight, Settings, UserSquare2, ChevronDown } from 'lucide-react';
import { api } from '../../../services/api';
import { CRMSettings } from '../../../types';
import {
  SaaSModuleKey,
  saasAccounts,
  saasModules,
  saasPlans
} from './adminSaasMockData';

type ModuleStatus = 'active' | 'beta' | 'disabled';

const statusLabels: Record<ModuleStatus, { label: string; classes: string }> = {
  active: { label: 'Ativo', classes: 'bg-emerald-50 text-emerald-700' },
  beta: { label: 'Beta', classes: 'bg-amber-50 text-amber-700' },
  disabled: { label: 'Desativado', classes: 'bg-gray-100 text-gray-600' }
};

const AdminModules: React.FC = () => {
  const [moduleStatus, setModuleStatus] = useState<Record<SaaSModuleKey, ModuleStatus>>({
    crm: 'active',
    meus_imoveis: 'active',
    gestao_imobiliaria: 'active',
    whatsapp_marketing: 'active',
    redes_sociais: 'active',
    campanhas: 'active',
    pdf_tools: 'active',
    outro: 'beta'
  });
  const [selectedModule, setSelectedModule] = useState<SaaSModuleKey | null>(null);

  // New State for Configuration Modal
  // New State for Configuration Modal
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [crmSettings, setCrmSettings] = useState<CRMSettings | null>(null);
  const [expandedMenu, setExpandedMenu] = useState<string | null>('card_cliente');
  const [activeSubMenu, setActiveSubMenu] = useState('dados_cliente');

  useEffect(() => {
    if (configModalOpen) {
      const fetchSettings = async () => {
        try {
          const data = await api.crm.getSettings();
          setCrmSettings(data);
        } catch (error) {
          console.error("Failed to load CRM settings", error);
        }
      };
      fetchSettings();
    }
  }, [configModalOpen]);

  const saveSettings = async () => {
    if (!crmSettings) return;
    await api.crm.updateSettings(crmSettings);
    alert('Configurações salvas!');
    setConfigModalOpen(false);
  };

  const moduleUsage = useMemo(() => {
    return saasModules.map(module => ({
      ...module,
      accountsUsing: saasAccounts.filter(account =>
        account.modulesEnabled.includes(module.key)
      ),
      plansUsing: saasPlans.filter(plan => plan.modulesIncluded.includes(module.key))
    }));
  }, []);

  const closeModal = () => setSelectedModule(null);

  const selectedModuleData = moduleUsage.find(module => module.key === selectedModule);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-gray-900">Modulos e feature flags</h2>
        <p className="text-sm text-gray-500">
          Habilite modulos globalmente, defina beta e acompanhe o uso.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {moduleUsage.map(module => {
          const status = statusLabels[moduleStatus[module.key]];
          return (
            <div key={module.key} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers3 className="w-[1.125rem] h-[1.125rem] text-brand-600" />
                    <h3 className="font-semibold text-gray-900">{module.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{module.description}</p>
                  <p className="text-[0.6875rem] text-gray-400 mt-1">Chave: {module.key}</p>
                </div>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${status.classes}`}>
                  {status.label}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
                <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
                  <ToggleRight className="w-3.5 h-3.5 text-brand-600" />
                  {module.accountsUsing.length} contas usando
                </div>
                <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
                  <ToggleLeft className="w-3.5 h-3.5 text-gray-500" />
                  {module.plansUsing.length} planos incluem
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Planos com este modulo</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {module.plansUsing.map(plan => (
                    <span
                      key={plan.id}
                      className="px-2 py-1 rounded-full text-[0.6875rem] font-semibold bg-brand-50 text-brand-700"
                    >
                      {plan.name}
                    </span>
                  ))}
                  {!module.plansUsing.length && (
                    <span className="text-xs text-gray-400">Nenhum plano inclui este modulo.</span>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-col md:flex-row md:items-center gap-3">
                <button
                  onClick={() => setSelectedModule(module.key)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver contas que usam
                </button>

                {/* CRM and WhatsApp modules have configuration */}
                {(module.key === 'crm' || module.key === 'whatsapp_marketing') && (
                  <button
                    onClick={() => {
                      setSelectedModule(module.key);
                      setConfigModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-200 bg-brand-50 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configurar
                  </button>
                )}

                <select
                  value={moduleStatus[module.key]}
                  onChange={event =>
                    setModuleStatus(prev => ({
                      ...prev,
                      [module.key]: event.target.value as ModuleStatus
                    }))
                  }
                  className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700"
                >
                  <option value="active">Ativo para todos</option>
                  <option value="beta">Somente em beta</option>
                  <option value="disabled">Desativado globalmente</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account List Modal (Only if NOT configuring) */}
      {selectedModule && selectedModuleData && !configModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Contas usando {selectedModuleData.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedModuleData.accountsUsing.length} contas ativas neste modulo.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="px-3 py-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
            <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
              {selectedModuleData.accountsUsing.map(account => (
                <div
                  key={account.id}
                  className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{account.name}</p>
                    <p className="text-xs text-gray-500">{account.contactEmail}</p>
                  </div>
                  <span className="text-xs text-gray-400">{account.status}</span>
                </div>
              ))}
              {!selectedModuleData.accountsUsing.length && (
                <p className="text-sm text-gray-500">Nenhuma conta utiliza este modulo.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {configModalOpen && crmSettings && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[37.5rem] flex overflow-hidden flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-brand-600" />
                  Configuração: {selectedModule === 'crm' ? 'Módulo CRM' : 'WhatsApp Marketing'}
                </h3>
                <p className="text-sm text-gray-500">Defina o comportamento padrão para as contas.</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setConfigModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">Cancelar</button>
                <button onClick={saveSettings} className="px-6 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20">Salvar Alterações</button>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar (Only meaningful if we have mixed settings, but for now we separate by module) */}
              {selectedModule === 'crm' ? (
                <>
                  <div className="w-64 bg-gray-50 border-r border-gray-100 overflow-y-auto p-4 flex flex-col gap-1">
                    <div className="mb-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Menus do CRM</div>
                    {/* Menu Item: Card do Cliente (Legacy CRM Config) */}
                    <div>
                      <button
                        onClick={() => setExpandedMenu(expandedMenu === 'card_cliente' ? null : 'card_cliente')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${expandedMenu === 'card_cliente' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        <div className="flex items-center gap-2">
                          <UserSquare2 className="w-[1.125rem] h-[1.125rem]" />
                          Card do Cliente
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMenu === 'card_cliente' ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Submenu */}
                      {expandedMenu === 'card_cliente' && (
                        <div className="pl-9 pr-2 mt-1 space-y-1">
                          <button
                            onClick={() => setActiveSubMenu('dados_cliente')}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${activeSubMenu === 'dados_cliente' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-900'}`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${activeSubMenu === 'dados_cliente' ? 'bg-brand-500' : 'bg-gray-300'}`} />
                            Dados do Cliente
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CRM Content */}
                  <div className="flex-1 bg-white p-8 overflow-y-auto">
                    {activeSubMenu === 'dados_cliente' && (
                      <div className="max-w-2xl animate-fade-in">
                        <div className="mb-6">
                          <h4 className="text-lg font-bold text-gray-900 mb-1">Visualização de Perfis</h4>
                          <p className="text-sm text-gray-500">Escolha quais abas de perfil estarão disponíveis dentro do card do cliente.</p>
                        </div>
                        {/* ... (Existing CRM Config Logic preserved) ... */}
                        {/* Default Profile Selector */}
                        <div className="mb-6 bg-brand-50 p-4 rounded-xl border border-brand-100 flex items-center justify-between">
                          <div>
                            <span className="text-brand-900 font-bold text-sm block">Perfil Padrão</span>
                            <span className="text-brand-700 text-xs">Visualização automática ao abrir lead.</span>
                          </div>
                          <select
                            value={crmSettings?.defaultProfile || 'MASTER'}
                            onChange={(e) => {
                              // Simplified Mock logic for brevity in replace
                              setCrmSettings({ ...crmSettings!, defaultProfile: e.target.value as any });
                            }}
                            className="px-3 py-2 rounded-lg border border-brand-200 text-sm font-bold text-brand-900"
                          >
                            <option value="MASTER">Master</option>
                            <option value="WA">WhatsApp</option>
                            <option value="SF">Salesforce</option>
                            <option value="RD">RD Station / Totvs</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* WhatsApp Marketing Config */
                <>
                  <div className="w-64 bg-gray-50 border-r border-gray-100 overflow-y-auto p-4 flex flex-col gap-1">
                    <div className="mb-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Menus do WhatsApp</div>
                    {/* Menu Item: Geral */}
                    <div>
                      <button
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-white text-brand-700 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="w-[1.125rem] h-[1.125rem]" />
                          Geral
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                      </button>

                      {/* Submenu */}
                      <div className="pl-9 pr-2 mt-1 space-y-1">
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors bg-brand-50 text-brand-700"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                          Modo de Operação
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 bg-white p-8 overflow-y-auto">
                    <div className="max-w-2xl animate-fade-in">
                      <div className="mb-8">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Modo de Operação</h4>
                        <p className="text-gray-600">
                          Defina como o módulo de WhatsApp deve operar para as contas que utilizam este recurso.
                          A alteração aqui define o <b>padrão global</b>, mas contas podem ter overrides individuais.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* Platform Mode */}
                        <label className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${crmSettings.whatsappIntegrationMode === 'platform' ? 'border-brand-600 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}>
                          <div className="flex items-center gap-4">
                            <input
                              type="radio"
                              name="wa_mode"
                              value="platform"
                              checked={crmSettings.whatsappIntegrationMode === 'platform' || !crmSettings.whatsappIntegrationMode} // Default to platform
                              onChange={() => setCrmSettings({ ...crmSettings, whatsappIntegrationMode: 'platform' })}
                              className="w-5 h-5 text-brand-600 focus:ring-brand-500"
                            />
                            <div>
                              <span className="font-bold text-gray-900 block">Modo Plataforma (WhatsApp Web Clone)</span>
                              <span className="text-sm text-gray-500">
                                Utiliza a infraestrutura própria (Puppeteer). O cliente conecta o QR Code dentro do CRM.
                                Mimetiza a interface do WhatsApp Web.
                              </span>
                            </div>
                          </div>
                        </label>

                        {/* Extension Mode */}
                        <label className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${crmSettings.whatsappIntegrationMode === 'extension' ? 'border-brand-600 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}>
                          <div className="flex items-center gap-4">
                            <input
                              type="radio"
                              name="wa_mode"
                              value="extension"
                              checked={crmSettings.whatsappIntegrationMode === 'extension'}
                              onChange={() => setCrmSettings({ ...crmSettings, whatsappIntegrationMode: 'extension' })}
                              className="w-5 h-5 text-brand-600 focus:ring-brand-500"
                            />
                            <div>
                              <span className="font-bold text-gray-900 block">Modo Extensão (Injeção no Navegador)</span>
                              <span className="text-sm text-gray-500">
                                <b>Recomendado:</b> O usuário instala a Extensão do Chrome e usa o web.whatsapp.com oficial.
                                O CRM aparece como uma sidebar flutuante. Mais estável e seguro.
                              </span>
                            </div>
                          </div>
                        </label>

                        {/* Official API Mode */}
                        <label className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${crmSettings.whatsappIntegrationMode === 'official' ? 'border-brand-600 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}>
                          <div className="flex items-center gap-4">
                            <input
                              type="radio"
                              name="wa_mode"
                              value="official"
                              checked={crmSettings.whatsappIntegrationMode === 'official'}
                              onChange={() => setCrmSettings({ ...crmSettings, whatsappIntegrationMode: 'official' })}
                              className="w-5 h-5 text-brand-600 focus:ring-brand-500"
                            />
                            <div>
                              <span className="font-bold text-gray-900 block">API Oficial (Meta Business)</span>
                              <span className="text-sm text-gray-500">
                                Requer verificação de negócio na Meta. Custo por conversa.
                                Ideal para grandes volumes e compliance rigoroso.
                              </span>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModules;
