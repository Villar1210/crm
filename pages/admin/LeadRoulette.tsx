import React, { useEffect, useMemo, useState } from 'react';
import { Play, Plus, X } from 'lucide-react';
import { api } from '../../services/api';
import { LeadStatus } from '../../types';

type LeadSource =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'site'
  | 'landing_page'
  | 'portal'
  | 'integracao_portal'
  | 'indication'
  | 'partner'
  | 'importado'
  | 'outro';

type LeadPipelineStage = LeadStatus;

type AgentStatus = 'disponivel' | 'pausado' | 'offline' | 'limite_atingido';

type RouletteStrategy = 'round_robin' | 'peso' | 'prioridade_fila';

type RouletteAgent = {
  id: string;
  name: string;
  email: string;
  role: 'corretor' | 'gestor';
  status: AgentStatus;
  weight: number;
  maxLeadsPerDay?: number | null;
  leadsToday: number;
  skills?: LeadSource[];
  workingHours?: string | null;
};

type RouletteRule = {
  id: string;
  name: string;
  active: boolean;
  strategy: RouletteStrategy;
  sources: LeadSource[];
  pipelines: LeadPipelineStage[];
  description?: string | null;
};

type RouletteLog = {
  id: string;
  leadId: string;
  leadName: string;
  source: LeadSource;
  pipelineStage: LeadPipelineStage;
  assignedTo: string;
  assignedToName: string;
  assignedAt: string;
  ruleId?: string | null;
};

type RouletteSettings = {
  enabled: boolean;
  defaultMode: 'always' | 'sources';
  criteria: {
    ignoreLimit: boolean;
    ignoreOffline: boolean;
    respectHours: boolean;
    allowSkip: boolean;
  };
  tieBreaker: 'least_leads' | 'longest_wait' | 'fixed_order';
};

type RouletteTab = 'config' | 'monitor';

type RuleFormState = {
  name: string;
  strategy: RouletteStrategy;
  sources: LeadSource[];
  pipelines: LeadPipelineStage[];
  description: string;
};

type SimulationResult = {
  agent?: RouletteAgent;
  rule?: RouletteRule | null;
  message: string;
};

type SimulationPrefill = {
  source?: LeadSource;
  stage?: LeadPipelineStage;
  excludeAgentId?: string | null;
  autoRun?: boolean;
};

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'site', label: 'Site' },
  { value: 'landing_page', label: 'Landing Page' },
  { value: 'portal', label: 'Portal' },
  { value: 'integracao_portal', label: 'Integracao Portal' },
  { value: 'indication', label: 'Indicacao' },
  { value: 'partner', label: 'Parceiro' },
  { value: 'importado', label: 'Importado' },
  { value: 'outro', label: 'Outro' }
];

const PIPELINE_OPTIONS: { value: LeadPipelineStage; label: string }[] = [
  { value: LeadStatus.NEW, label: 'Novo' },
  { value: LeadStatus.TRIAGE, label: 'Em Atendimento' },
  { value: LeadStatus.QUALIFIED, label: 'Qualificado' },
  { value: LeadStatus.VISIT_SCHEDULED, label: 'Visita' },
  { value: LeadStatus.PROPOSAL, label: 'Proposta' },
  { value: LeadStatus.NEGOTIATION, label: 'Negociacao' },
  { value: LeadStatus.CLOSED, label: 'Vendido' },
  { value: LeadStatus.DISQUALIFIED, label: 'Nao Qualificado' },
  { value: LeadStatus.LOST, label: 'Arquivado' }
];

const STRATEGY_OPTIONS: { value: RouletteStrategy; label: string; helper: string }[] = [
  {
    value: 'round_robin',
    label: 'Round-robin (sequencial)',
    helper: 'Distribui em ordem equilibrada de fila.'
  },
  {
    value: 'peso',
    label: 'Por peso (mais leads para maior peso)',
    helper: 'Prioriza agentes com maior peso configurado.'
  },
  {
    value: 'prioridade_fila',
    label: 'Prioridade de fila (ordem de chegada)',
    helper: 'Segue a ordem fixa de entrada do corretor.'
  }
];

const STATUS_STYLES: Record<AgentStatus, { label: string; className: string }> = {
  disponivel: {
    label: 'Disponivel',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  pausado: {
    label: 'Pausado',
    className: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  offline: {
    label: 'Offline',
    className: 'bg-slate-100 text-slate-500 border-slate-200'
  },
  limite_atingido: {
    label: 'Limite atingido',
    className: 'bg-rose-50 text-rose-700 border-rose-200'
  }
};

const defaultRuleForm: RuleFormState = {
  name: '',
  strategy: 'round_robin',
  sources: [],
  pipelines: [],
  description: ''
};

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('pt-BR');
};

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}> = ({ checked, onChange, ariaLabel }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      className="sr-only peer"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={ariaLabel}
    />
    <div className="w-10 h-5 bg-slate-200 rounded-full peer-checked:bg-emerald-500 transition-colors relative">
      <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
    </div>
  </label>
);

const LeadRoulette: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RouletteTab>('config');
  const [rouletteEnabled, setRouletteEnabled] = useState(true);
  const [rules, setRules] = useState<RouletteRule[]>([]);
  const [agents, setAgents] = useState<RouletteAgent[]>([]);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleFormState>(defaultRuleForm);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [simulationSource, setSimulationSource] = useState<LeadSource>('whatsapp');
  const [simulationStage, setSimulationStage] = useState<LeadPipelineStage>(LeadStatus.NEW);
  const [simulationExcludeAgentId, setSimulationExcludeAgentId] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [defaultMode, setDefaultMode] = useState<'always' | 'sources'>('always');
  const [criteria, setCriteria] = useState({
    ignoreLimit: true,
    ignoreOffline: true,
    respectHours: true,
    allowSkip: false
  });
  const [tieBreaker, setTieBreaker] = useState<'least_leads' | 'longest_wait' | 'fixed_order'>('least_leads');
  const [logSearch, setLogSearch] = useState('');
  const [logAgent, setLogAgent] = useState<string>('all');
  const [logSource, setLogSource] = useState<LeadSource | 'all'>('all');
  const [logRule, setLogRule] = useState<string>('all');
  const [logPeriod, setLogPeriod] = useState<'today' | '7d' | '30d'>('7d');
  const [logs, setLogs] = useState<RouletteLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRouletteData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [settings, fetchedRules, fetchedAgents, fetchedLogs] = await Promise.all([
        api.leadRoulette.getSettings(),
        api.leadRoulette.getRules(),
        api.leadRoulette.getAgents(),
        api.leadRoulette.getLogs()
      ]);

      setRouletteEnabled(Boolean(settings.enabled));
      setDefaultMode(settings.defaultMode || 'always');
      setCriteria({
        ignoreLimit: settings.criteria?.ignoreLimit ?? true,
        ignoreOffline: settings.criteria?.ignoreOffline ?? true,
        respectHours: settings.criteria?.respectHours ?? true,
        allowSkip: settings.criteria?.allowSkip ?? false
      });
      setTieBreaker(settings.tieBreaker || 'least_leads');
      setRules(fetchedRules || []);
      setAgents(fetchedAgents || []);
      setLogs(fetchedLogs || []);
    } catch (err: any) {
      setError(err?.message || 'Falha ao carregar dados da roleta.');
    } finally {
      setLoading(false);
    }
  };

  const persistSettings = async (next: Partial<RouletteSettings>) => {
    const payload = {
      enabled: next.enabled ?? rouletteEnabled,
      defaultMode: next.defaultMode ?? defaultMode,
      criteria: next.criteria ?? criteria,
      tieBreaker: next.tieBreaker ?? tieBreaker
    };

    try {
      await api.leadRoulette.updateSettings(payload);
    } catch (err: any) {
      setError(err?.message || 'Falha ao salvar configuracoes.');
    }
  };

  const updateEnabled = (enabled: boolean) => {
    setRouletteEnabled(enabled);
    persistSettings({ enabled });
  };

  const updateDefaultMode = (mode: 'always' | 'sources') => {
    setDefaultMode(mode);
    persistSettings({ defaultMode: mode });
  };

  const updateCriteria = (updates: Partial<RouletteSettings['criteria']>) => {
    const next = { ...criteria, ...updates };
    setCriteria(next);
    persistSettings({ criteria: next });
  };

  const updateTieBreaker = (value: RouletteSettings['tieBreaker']) => {
    setTieBreaker(value);
    persistSettings({ tieBreaker: value });
  };

  useEffect(() => {
    loadRouletteData();
  }, []);

  const activeRules = useMemo(() => rules.filter(rule => rule.active), [rules]);

  const ruleMap = useMemo(() => {
    return rules.reduce<Record<string, RouletteRule>>((acc, rule) => {
      acc[rule.id] = rule;
      return acc;
    }, {});
  }, [rules]);

  const statusSummary = useMemo(() => {
    const initial: Record<AgentStatus, number> = {
      disponivel: 0,
      pausado: 0,
      offline: 0,
      limite_atingido: 0
    };

    return agents.reduce((acc, agent) => {
      acc[agent.status] += 1;
      return acc;
    }, initial);
  }, [agents]);

  const matchingRuleIds = useMemo(() => {
    return activeRules
      .filter(rule => rule.sources.includes(simulationSource) && rule.pipelines.includes(simulationStage))
      .map(rule => rule.id);
  }, [activeRules, simulationSource, simulationStage]);

  const filteredLogs = useMemo(() => {
    const searchValue = logSearch.trim().toLowerCase();
    const now = new Date();
    const periodDays = logPeriod === '7d' ? 7 : logPeriod === '30d' ? 30 : 0;
    const threshold = periodDays
      ? new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return logs.filter(log => {
      if (searchValue && !log.leadName.toLowerCase().includes(searchValue)) {
        return false;
      }
      if (logAgent !== 'all' && log.assignedTo !== logAgent) {
        return false;
      }
      if (logSource !== 'all' && log.source !== logSource) {
        return false;
      }
      if (logRule !== 'all' && log.ruleId !== logRule) {
        return false;
      }

      const assignedDate = new Date(log.assignedAt);
      if (Number.isNaN(assignedDate.getTime())) {
        return true;
      }

      if (logPeriod === 'today') {
        return assignedDate.toDateString() === now.toDateString();
      }

      return assignedDate >= threshold;
    });
  }, [logSearch, logAgent, logSource, logRule, logPeriod, logs]);

  const getStrategyLabel = (strategy: RouletteStrategy) => {
    return STRATEGY_OPTIONS.find(option => option.value === strategy)?.label || strategy;
  };

  const openRuleModal = (rule?: RouletteRule) => {
    if (rule) {
      setEditingRuleId(rule.id);
      setRuleForm({
        name: rule.name,
        strategy: rule.strategy,
        sources: rule.sources,
        pipelines: rule.pipelines,
        description: rule.description || ''
      });
    } else {
      setEditingRuleId(null);
      setRuleForm(defaultRuleForm);
    }
    setRuleModalOpen(true);
  };

  const handleRuleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmedName = ruleForm.name.trim();
    if (!trimmedName) {
      setError('Informe o nome da regra.');
      return;
    }
    if (ruleForm.sources.length === 0 || ruleForm.pipelines.length === 0) {
      setError('Selecione pelo menos uma fonte e um estagio.');
      return;
    }

    try {
      if (editingRuleId) {
        const updated = await api.leadRoulette.updateRule(editingRuleId, {
          name: trimmedName,
          strategy: ruleForm.strategy,
          sources: ruleForm.sources,
          pipelines: ruleForm.pipelines,
          description: ruleForm.description.trim() || null
        });
        setRules(prev => prev.map(rule => (rule.id === editingRuleId ? updated : rule)));
      } else {
        const created = await api.leadRoulette.createRule({
          name: trimmedName,
          active: true,
          strategy: ruleForm.strategy,
          sources: ruleForm.sources,
          pipelines: ruleForm.pipelines,
          description: ruleForm.description.trim() || null
        });
        setRules(prev => [created, ...prev]);
      }

      setRuleModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Falha ao salvar regra.');
    }
  };

  const toggleRuleActive = async (ruleId: string) => {
    const target = rules.find(rule => rule.id === ruleId);
    if (!target) return;
    setRules(prev =>
      prev.map(rule => (rule.id === ruleId ? { ...rule, active: !rule.active } : rule))
    );
    try {
      const updated = await api.leadRoulette.updateRule(ruleId, { active: !target.active });
      setRules(prev => prev.map(rule => (rule.id === ruleId ? updated : rule)));
    } catch (err: any) {
      setError(err?.message || 'Falha ao atualizar regra.');
      loadRouletteData();
    }
  };

  const duplicateRule = async (rule: RouletteRule) => {
    try {
      const created = await api.leadRoulette.createRule({
        name: `${rule.name} (copia)`,
        active: rule.active,
        strategy: rule.strategy,
        sources: rule.sources,
        pipelines: rule.pipelines,
        description: rule.description || null
      });
      setRules(prev => [created, ...prev]);
    } catch (err: any) {
      setError(err?.message || 'Falha ao duplicar regra.');
    }
  };

  const removeRule = async (ruleId: string) => {
    try {
      await api.leadRoulette.deleteRule(ruleId);
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
    } catch (err: any) {
      setError(err?.message || 'Falha ao excluir regra.');
    }
  };

  const updateAgent = async (agentId: string, updates: Partial<RouletteAgent>) => {
    setAgents(prev =>
      prev.map(agent => (agent.id === agentId ? { ...agent, ...updates } : agent))
    );
    try {
      const updated = await api.leadRoulette.updateAgent(agentId, updates);
      setAgents(prev => prev.map(agent => (agent.id === agentId ? updated : agent)));
    } catch (err: any) {
      setError(err?.message || 'Falha ao atualizar corretor.');
      loadRouletteData();
    }
  };

  const toggleParticipation = (agent: RouletteAgent) => {
    const isParticipating = agent.status !== 'offline';
    updateAgent(agent.id, { status: isParticipating ? 'offline' : 'disponivel' });
  };

  const togglePause = (agent: RouletteAgent) => {
    if (agent.status === 'offline') {
      return;
    }
    updateAgent(agent.id, { status: agent.status === 'pausado' ? 'disponivel' : 'pausado' });
  };

  const resetLeadsToday = async (agent: RouletteAgent) => {
    try {
      const updated = await api.leadRoulette.resetAgentDay(agent.id);
      setAgents(prev => prev.map(item => (item.id === agent.id ? updated : item)));
    } catch (err: any) {
      setError(err?.message || 'Falha ao resetar contador.');
    }
  };

  const openSimulation = (prefill?: SimulationPrefill) => {
    const nextSource = prefill?.source ?? simulationSource;
    const nextStage = prefill?.stage ?? simulationStage;
    const nextExclude = prefill?.excludeAgentId ?? null;
    setSimulationSource(nextSource);
    setSimulationStage(nextStage);
    setSimulationExcludeAgentId(nextExclude);
    setSimulationResult(null);
    setSimulationOpen(true);

    if (prefill?.autoRun) {
      runSimulation(nextSource, nextStage, nextExclude);
    }
  };

  const runSimulation = async (
    source?: LeadSource,
    stage?: LeadPipelineStage,
    excludeAgentId?: string | null
  ) => {
    setError(null);
    try {
      const result = await api.leadRoulette.simulate({
        source: source ?? simulationSource,
        stage: stage ?? simulationStage,
        excludeAgentId: excludeAgentId ?? simulationExcludeAgentId
      });
      setSimulationResult(result);
    } catch (err: any) {
      setError(err?.message || 'Falha ao simular distribuicao.');
    }
  };

  const handleRedistribute = (log: RouletteLog) => {
    openSimulation({
      source: log.source,
      stage: log.pipelineStage,
      excludeAgentId: log.assignedTo,
      autoRun: true
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {loading && (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-xl px-4 py-3">
          Carregando configuracoes da roleta...
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Distribuicao de Leads via Roleta</h2>
          <p className="text-gray-500 text-sm">
            Defina como os leads serao distribuidos automaticamente entre os corretores.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-white rounded-full border border-slate-100 shadow-sm px-4 py-2">
            <span className="text-xs font-semibold text-gray-500">Roleta ativa</span>
            <ToggleSwitch
              checked={rouletteEnabled}
              onChange={updateEnabled}
              ariaLabel="Ativar ou desativar roleta"
            />
          </div>
          <button
            onClick={() => openSimulation()}
            className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-brand-700 flex items-center gap-2"
          >
            <Play className="w-4 h-4" /> Simular distribuicao
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-2">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('config')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'config'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Configuracao
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'monitor'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Monitoramento / Log
          </button>
        </div>
      </div>

      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Regras de distribuicao</h3>
                <p className="text-xs text-gray-500">
                  Defina fontes, estagios e estrategias para cada regra da roleta.
                </p>
              </div>
              <button
                onClick={() => openRuleModal()}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nova regra de roleta
              </button>
            </div>

            <div className="space-y-3">
              {rules.map(rule => (
                <div
                  key={rule.id}
                  className="border border-slate-100 rounded-2xl p-4 bg-slate-50/60 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{rule.name}</h4>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${rule.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                      >
                        {rule.active ? 'Ativa' : 'Inativa'}
                      </span>
                      <span className="text-xs text-gray-500">{getStrategyLabel(rule.strategy)}</span>
                    </div>
                    {rule.description && (
                      <p className="text-xs text-gray-500 max-w-2xl">{rule.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="uppercase text-[0.625rem] font-bold text-gray-400">Fontes</span>
                      {rule.sources.map(source => (
                        <span
                          key={source}
                          className="px-2 py-0.5 rounded-full bg-white text-gray-600 border border-slate-200"
                        >
                          {SOURCE_OPTIONS.find(option => option.value === source)?.label || source}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="uppercase text-[0.625rem] font-bold text-gray-400">Estagios</span>
                      {rule.pipelines.map(stage => (
                        <span
                          key={stage}
                          className="px-2 py-0.5 rounded-full bg-white text-gray-600 border border-slate-200"
                        >
                          {PIPELINE_OPTIONS.find(option => option.value === stage)?.label || stage}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">Ativa</span>
                      <ToggleSwitch
                        checked={rule.active}
                        onChange={() => toggleRuleActive(rule.id)}
                        ariaLabel="Ativar ou desativar regra"
                      />
                    </div>
                    <button
                      onClick={() => openRuleModal(rule)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-white"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => duplicateRule(rule)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-white"
                    >
                      Duplicar
                    </button>
                    <button
                      onClick={() => removeRule(rule.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Corretores na roleta</h3>
              <p className="text-xs text-gray-500">
                Ajuste peso, limites e disponibilidade de cada corretor.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Corretor</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Peso</th>
                    <th className="px-4 py-3">Limite/dia</th>
                    <th className="px-4 py-3">Leads hoje</th>
                    <th className="px-4 py-3">Fontes preferenciais</th>
                    <th className="px-4 py-3">Horario</th>
                    <th className="px-4 py-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agents.map(agent => (
                    <tr key={agent.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{agent.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{agent.role}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{agent.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[agent.status].className
                            }`}
                        >
                          {STATUS_STYLES[agent.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          value={agent.weight}
                          onChange={event =>
                            updateAgent(agent.id, { weight: Number(event.target.value) || 1 })
                          }
                          className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          value={agent.maxLeadsPerDay ?? ''}
                          onChange={event => {
                            const value = event.target.value;
                            updateAgent(agent.id, {
                              maxLeadsPerDay: value === '' ? null : Number(value)
                            });
                          }}
                          className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                        {agent.leadsToday}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {(agent.skills?.length ? agent.skills : ['outro']).map(source => (
                            <span
                              key={`${agent.id}-${source}`}
                              className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs"
                            >
                              {SOURCE_OPTIONS.find(option => option.value === source)?.label || source}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{agent.workingHours}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Participa</span>
                            <ToggleSwitch
                              checked={agent.status !== 'offline'}
                              onChange={() => toggleParticipation(agent)}
                              ariaLabel="Participa da roleta"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => togglePause(agent)}
                              disabled={agent.status === 'offline'}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${agent.status === 'offline'
                                ? 'border-slate-100 text-slate-300'
                                : 'border-slate-200 text-slate-600 hover:bg-white'
                                }`}
                            >
                              {agent.status === 'pausado' ? 'Retomar' : 'Pausar'}
                            </button>
                            <button
                              onClick={() => resetLeadsToday(agent)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-white"
                            >
                              Resetar dia
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Opcoes gerais da roleta</h3>
              <p className="text-xs text-gray-500">Defina o comportamento padrao da distribuicao.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-start gap-2 border border-slate-200 rounded-xl p-3 text-sm">
                  <input
                    type="radio"
                    name="defaultMode"
                    checked={defaultMode === 'always'}
                    onChange={() => updateDefaultMode('always')}
                    className="mt-1 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    <span className="font-semibold text-gray-900">Sempre usar roleta</span>
                    <span className="block text-xs text-gray-500">
                      Distribui automaticamente todo lead novo.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 border border-slate-200 rounded-xl p-3 text-sm">
                  <input
                    type="radio"
                    name="defaultMode"
                    checked={defaultMode === 'sources'}
                    onChange={() => updateDefaultMode('sources')}
                    className="mt-1 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    <span className="font-semibold text-gray-900">Somente fontes especificas</span>
                    <span className="block text-xs text-gray-500">
                      A roleta atua apenas em canais selecionados.
                    </span>
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={criteria.ignoreLimit}
                    onChange={() => updateCriteria({ ignoreLimit: !criteria.ignoreLimit })}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  Ignorar corretores com limite diario atingido
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={criteria.ignoreOffline}
                    onChange={() => updateCriteria({ ignoreOffline: !criteria.ignoreOffline })}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  Ignorar corretores offline
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={criteria.respectHours}
                    onChange={() => updateCriteria({ respectHours: !criteria.respectHours })}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  Respeitar horario de atendimento
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={criteria.allowSkip}
                    onChange={() => updateCriteria({ allowSkip: !criteria.allowSkip })}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  Permitir pular corretor que nao atendeu lead anterior
                </label>
              </div>

              <div className="max-w-sm">
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Criterio de desempate
                </label>
                <select
                  value={tieBreaker}
                  onChange={event =>
                    updateTieBreaker(event.target.value as RouletteSettings['tieBreaker'])
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="least_leads">Menor numero de leads hoje</option>
                  <option value="longest_wait">Mais tempo sem receber lead</option>
                  <option value="fixed_order">Ordem fixa cadastrada</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monitor' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-xs font-semibold text-gray-500 uppercase">Status dos corretores</span>
              {(Object.keys(statusSummary) as AgentStatus[]).map(status => (
                <span
                  key={status}
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[status].className
                    }`}
                >
                  {STATUS_STYLES[status].label}
                  <span className="text-[0.6875rem] font-bold">{statusSummary[status]}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
                <p className="text-xs text-gray-500">Refine o historico de distribuicao.</p>
              </div>
              <button
                onClick={() => {
                  setLogSearch('');
                  setLogAgent('all');
                  setLogSource('all');
                  setLogRule('all');
                  setLogPeriod('7d');
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-white"
              >
                Limpar filtros
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Buscar lead</label>
                <input
                  type="text"
                  value={logSearch}
                  onChange={event => setLogSearch(event.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Nome do lead"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Corretor</label>
                <select
                  value={logAgent}
                  onChange={event => setLogAgent(event.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">Todos</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Fonte</label>
                <select
                  value={logSource}
                  onChange={event => setLogSource(event.target.value as LeadSource | 'all')}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">Todas</option>
                  {SOURCE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Regra</label>
                <select
                  value={logRule}
                  onChange={event => setLogRule(event.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">Todas</option>
                  {rules.map(rule => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Periodo</label>
                <select
                  value={logPeriod}
                  onChange={event => setLogPeriod(event.target.value as 'today' | '7d' | '30d')}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="today">Hoje</option>
                  <option value="7d">Ultimos 7 dias</option>
                  <option value="30d">Ultimos 30 dias</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Historico de distribuicao</h3>
                <p className="text-xs text-gray-500">{filteredLogs.length} registros</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Data/hora</th>
                    <th className="px-4 py-3">Lead</th>
                    <th className="px-4 py-3">Fonte</th>
                    <th className="px-4 py-3">Estagio</th>
                    <th className="px-4 py-3">Corretor</th>
                    <th className="px-4 py-3">Regra</th>
                    <th className="px-4 py-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDateTime(log.assignedAt)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{log.leadName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                          {SOURCE_OPTIONS.find(option => option.value === log.source)?.label || log.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {PIPELINE_OPTIONS.find(option => option.value === log.pipelineStage)?.label ||
                          log.pipelineStage}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.assignedToName}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {log.ruleId ? ruleMap[log.ruleId]?.name || 'Regra removida' : 'Sem regra'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => console.log('Ver lead', log.leadId)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-white"
                          >
                            Ver lead
                          </button>
                          <button
                            onClick={() => handleRedistribute(log)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-white"
                          >
                            Re-distribuir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                        Nenhum registro encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {ruleModalOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingRuleId ? 'Editar regra de roleta' : 'Nova regra de roleta'}
                </h3>
                <p className="text-xs text-gray-500">
                  Configure estrategia, fontes e estagios atendidos.
                </p>
              </div>
              <button onClick={() => setRuleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRuleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nome da regra</label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={event => setRuleForm(prev => ({ ...prev, name: event.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex: WhatsApp + Site"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Estrategia</label>
                <select
                  value={ruleForm.strategy}
                  onChange={event =>
                    setRuleForm(prev => ({ ...prev, strategy: event.target.value as RouletteStrategy }))
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  {STRATEGY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {STRATEGY_OPTIONS.find(option => option.value === ruleForm.strategy)?.helper}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Fontes atendidas</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SOURCE_OPTIONS.map(option => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-xs text-gray-600"
                    >
                      <input
                        type="checkbox"
                        checked={ruleForm.sources.includes(option.value)}
                        onChange={() =>
                          setRuleForm(prev => ({
                            ...prev,
                            sources: prev.sources.includes(option.value)
                              ? prev.sources.filter(source => source !== option.value)
                              : [...prev.sources, option.value]
                          }))
                        }
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Estagios do funil</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PIPELINE_OPTIONS.map(option => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-xs text-gray-600"
                    >
                      <input
                        type="checkbox"
                        checked={ruleForm.pipelines.includes(option.value)}
                        onChange={() =>
                          setRuleForm(prev => ({
                            ...prev,
                            pipelines: prev.pipelines.includes(option.value)
                              ? prev.pipelines.filter(stage => stage !== option.value)
                              : [...prev.pipelines, option.value]
                          }))
                        }
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Descricao</label>
                <textarea
                  value={ruleForm.description}
                  onChange={event => setRuleForm(prev => ({ ...prev, description: event.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[90px]"
                  placeholder="Opcional"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700"
                >
                  Salvar regra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {simulationOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Simular distribuicao</h3>
                <p className="text-xs text-gray-500">
                  Verifique qual corretor receberia o lead agora.
                </p>
              </div>
              <button onClick={() => setSimulationOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Fonte do lead</label>
                <select
                  value={simulationSource}
                  onChange={event => setSimulationSource(event.target.value as LeadSource)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  {SOURCE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Estagio do pipeline</label>
                <select
                  value={simulationStage}
                  onChange={event => setSimulationStage(event.target.value as LeadPipelineStage)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  {PIPELINE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Regras ativas/respeitadas</p>
              <div className="flex flex-wrap gap-2">
                {activeRules.length === 0 && (
                  <span className="text-xs text-gray-400">Nenhuma regra ativa cadastrada.</span>
                )}
                {activeRules.map(rule => (
                  <span
                    key={rule.id}
                    className={`px-2 py-0.5 rounded-full text-xs border ${matchingRuleIds.includes(rule.id)
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-white text-gray-500 border-slate-200'
                      }`}
                  >
                    {rule.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSimulationOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => runSimulation()}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700"
              >
                Simular
              </button>
            </div>

            {simulationResult && (
              <div className="border border-slate-100 bg-white rounded-2xl p-4">
                <p className="text-sm font-semibold text-gray-900">Resultado</p>
                <p className="text-sm text-gray-600 mt-1">{simulationResult.message}</p>
                {simulationResult.agent && (
                  <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-4">
                    <span>
                      Peso: <strong className="text-gray-700">{simulationResult.agent.weight}</strong>
                    </span>
                    <span>
                      Leads hoje:{' '}
                      <strong className="text-gray-700">{simulationResult.agent.leadsToday}</strong>
                    </span>
                    <span>
                      Status:{' '}
                      <strong className="text-gray-700">
                        {STATUS_STYLES[simulationResult.agent.status].label}
                      </strong>
                    </span>
                  </div>
                )}
                {simulationResult.rule && (
                  <p className="text-xs text-gray-500 mt-2">
                    Regra aplicada: <strong>{simulationResult.rule.name}</strong>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadRoulette;
