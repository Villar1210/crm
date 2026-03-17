import { useEffect, useMemo, useRef, useState } from 'react';
import type { CrmSettings } from '../../types';
import { WhatsAppScraper } from '../../content/scraper';

type ViewMode = 'compact' | 'embedded';

type Lead = {
  id: string;
  name?: string;
  phone?: string;
  status?: string;
  value?: number | string | null;
  temperature?: string | null;
  updatedAt?: string;
};

type StageOption = { value: string; label: string };

const DEFAULT_STAGE_OPTIONS: StageOption[] = [
  { value: 'Em Triagem', label: 'Em Atendimento' },
  { value: 'Qualificado', label: 'Qualificados' },
  { value: 'Visita', label: 'Visita Agendada' },
  { value: 'Proposta', label: 'Proposta' },
  { value: 'Negociação', label: 'Negociação' },
  { value: 'Vendido', label: 'Vendido' },
  { value: 'Não Qualificado', label: 'Não Qualificado' },
  { value: 'Arquivado', label: 'Perdidos' },
];

function sendRuntimeMessage<T>(message: any): Promise<T> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      resolve({} as T);
      return;
    }
    chrome.runtime.sendMessage(message, resolve);
  });
}

const normalizeKey = (value?: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const getCrmBaseUrl = (settings?: CrmSettings) => {
  if (!settings) return '';
  const candidate = settings.appUrl || settings.baseUrl?.replace(/\/api\/?$/, '');
  if (!candidate) return '';
  const [base] = candidate.split('/#');
  return base || '';
};

const buildCrmUrl = (settings: CrmSettings | null, route: string) => {
  const base = getCrmBaseUrl(settings || undefined);
  if (!base) return '';
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  return `${base}/#${normalizedRoute}`;
};

const formatValue = (value?: number | string | null) => {
  if (value == null || value === '') return 'R$ 0';
  const parsed =
    typeof value === 'number'
      ? value
      : Number(String(value).replace(/[^\d.-]/g, '').replace(',', '.'));
  if (!Number.isFinite(parsed)) return String(value);
  return parsed.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
};

export function PipelinePanel() {
  const [settings, setSettings] = useState<CrmSettings | null>(null);
  const [mode, setMode] = useState<ViewMode>('embedded');
  const [showFullPanel, setShowFullPanel] = useState(false);
  const [resolvedCrmUrl, setResolvedCrmUrl] = useState('');
  const [embedState, setEmbedState] = useState<'idle' | 'loading' | 'error' | 'ok'>('idle');
  const [embedMessage, setEmbedMessage] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stageOptions, setStageOptions] = useState<StageOption[]>(DEFAULT_STAGE_OPTIONS);
  const [stageSource, setStageSource] = useState<'default' | 'pipeline' | 'statuses'>('default');
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const inFlightRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const draggedRef = useRef<{ stage: string; leadId: string } | null>(null);

  useEffect(() => {
    let active = true;
    sendRuntimeMessage<{ settings: CrmSettings }>({ type: 'GET_SETTINGS' })
      .then((response) => {
        if (!active) return;
        setSettings(response?.settings || null);
      })
      .catch(() => {
        if (active) setSettings(null);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const resolveOwnerId = async () => {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const id = await WhatsAppScraper.getMe();
        if (id) {
          if (!cancelled) setOwnerId(id);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      if (!cancelled) setOwnerId(null);
    };
    resolveOwnerId();
    return () => {
      cancelled = true;
    };
  }, []);

  const crmPipelineUrl = useMemo(() => buildCrmUrl(settings, '/admin/crm'), [settings]);

  useEffect(() => {
    setResolvedCrmUrl(crmPipelineUrl);
  }, [crmPipelineUrl]);

  useEffect(() => {
    if (mode !== 'embedded') {
      setEmbedState('idle');
      setEmbedMessage(null);
      return;
    }
    if (!crmPipelineUrl) {
      setEmbedState('error');
      setEmbedMessage('Configure a URL do CRM nas configuracoes para abrir a pipeline.');
      return;
    }

    let cancelled = false;
    const [base, routePart] = crmPipelineUrl.split('/#');
    const normalizedRoute = routePart
      ? routePart.startsWith('/')
        ? routePart
        : `/${routePart}`
      : '/admin/crm';

    const ping = async (url: string) => {
      const response = await sendRuntimeMessage<{ ok?: boolean }>({ type: 'PING_APP_URL', url });
      return !!response?.ok;
    };

    const validate = async () => {
      setEmbedState('loading');
      setEmbedMessage(null);
      let ok = await ping(base);
      if (!ok && base.startsWith('https://')) {
        const httpBase = `http://${base.slice('https://'.length)}`;
        ok = await ping(httpBase);
        if (ok && !cancelled) {
          setResolvedCrmUrl(`${httpBase}/#${normalizedRoute}`);
        }
      }
      if (cancelled) return;
      if (ok) {
        setEmbedState('ok');
        return;
      }
      setEmbedState('error');
      setEmbedMessage('Servidor offline. Use "Abrir CRM" para abrir em uma nova aba.');
    };

    validate();

    return () => {
      cancelled = true;
    };
  }, [mode, crmPipelineUrl]);

  const mergedStageOptions = useMemo(() => {
    const baseOptions = stageSource === 'pipeline' ? stageOptions : DEFAULT_STAGE_OPTIONS;
    const options = [...baseOptions];
    const existing = new Set(options.map((opt) => normalizeKey(opt.value)));

    if (stageSource !== 'pipeline') {
      stageOptions.forEach((opt) => {
        const key = normalizeKey(opt.value);
        if (!key || existing.has(key)) return;
        existing.add(key);
        options.push(opt);
      });
    }

    if (stageSource !== 'pipeline') {
      leads.forEach((lead) => {
        const key = normalizeKey(lead.status);
        if (!key || existing.has(key)) return;
        existing.add(key);
        options.push({ value: lead.status || 'Sem Status', label: lead.status || 'Sem Status' });
      });
    }
    return options;
  }, [leads, stageOptions, stageSource]);

  const stageMap = useMemo(() => {
    const map = new Map<string, StageOption>();
    mergedStageOptions.forEach((stage) => {
      map.set(normalizeKey(stage.value), stage);
    });
    return map;
  }, [mergedStageOptions]);

  const columns = useMemo(() => {
    return mergedStageOptions.map((stage) => {
      const key = normalizeKey(stage.value);
      const cards = leads.filter((lead) => normalizeKey(lead.status) === key);
      return { stage, cards };
    });
  }, [mergedStageOptions, leads]);

  const fetchStages = async () => {
    if (!ownerId) return;
    try {
      const response = await sendRuntimeMessage<{ statuses?: string[]; options?: StageOption[] }>({
        type: 'FETCH_STATUSES',
        ownerId,
      });
      if (response?.options?.length) {
        setStageOptions(response.options);
        setStageSource('pipeline');
        return;
      }
      if (response?.statuses?.length) {
        setStageOptions(response.statuses.map((status) => ({ value: status, label: status })));
        setStageSource('statuses');
      }
    } catch {
      // Ignore stage fetch failures.
    }
  };

  const fetchLeads = async () => {
    if (!ownerId || inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      const response = await sendRuntimeMessage<{ leads?: Lead[]; error?: string }>({
        type: 'FETCH_LEADS',
        ownerId,
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      setLeads(Array.isArray(response?.leads) ? response.leads : []);
      setLastSyncAt(Date.now());
      setSyncState('idle');
    } catch {
      setSyncState('error');
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (!ownerId || (mode !== 'compact' && !showFullPanel)) return;
    fetchStages();
    fetchLeads();
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    timerRef.current = window.setInterval(fetchLeads, 30000);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [ownerId, mode, showFullPanel]);

  const openExternal = () => {
    const target = resolvedCrmUrl || crmPipelineUrl;
    if (!target) return;
    window.open(target, '_blank', 'noopener');
  };

  const openFullPanel = () => {
    setMode('embedded');
    setShowFullPanel(true);
  };

  const closeFullPanel = () => {
    setShowFullPanel(false);
    setMode('compact');
  };

  const handleDragStart = (stage: string, leadId: string) => {
    draggedRef.current = { stage, leadId };
  };

  const handleDrop = async (targetStage: StageOption) => {
    const dragged = draggedRef.current;
    draggedRef.current = null;
    if (!dragged) return;
    if (normalizeKey(dragged.stage) === normalizeKey(targetStage.value)) return;
    const lead = leads.find((item) => item.id === dragged.leadId);
    if (!lead) return;

    const updatedStage = targetStage.value;
    setLeads((current) =>
      current.map((item) => (item.id === lead.id ? { ...item, status: updatedStage } : item))
    );
    setSyncState('syncing');
    try {
      await sendRuntimeMessage({
        type: 'SAVE_LEAD',
        leadId: lead.id,
        payload: {
          status: updatedStage,
          lastInteraction: new Date().toISOString(),
        },
      });
      setSyncState('idle');
    } catch {
      setSyncState('error');
      setLeads((current) =>
        current.map((item) => (item.id === lead.id ? { ...item, status: lead.status } : item))
      );
    }
  };

  const pipelineBoard = (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex gap-4 custom-scrollbar">
      {columns.map((column) => (
        <div
          key={column.stage.value}
          className="min-w-[260px] w-[260px] flex flex-col h-full rounded-xl border bg-slate-50/50 border-slate-200"
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => handleDrop(column.stage)}
        >
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
            <h3 className="text-xs font-bold uppercase text-slate-600">
              {stageMap.get(normalizeKey(column.stage.value))?.label || column.stage.label}
            </h3>
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {column.cards.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {column.cards.map((lead) => (
              <div
                key={lead.id}
                draggable
                onDragStart={() => handleDragStart(column.stage.value, lead.id)}
                className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {(lead.name || 'L')[0]}
                    </div>
                    <span className="font-bold text-xs text-slate-800">{lead.name || 'Sem Nome'}</span>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      lead.temperature === 'hot'
                        ? 'bg-rose-500'
                        : lead.temperature === 'warm'
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                    }`}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Valor:</span>
                  <span className="font-semibold text-slate-700">{formatValue(lead.value)}</span>
                </div>
                {lead.phone ? (
                  <div className="mt-1 text-[10px] text-slate-400">{lead.phone}</div>
                ) : null}
              </div>
            ))}
            {column.cards.length === 0 ? (
              <div className="h-20 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-400 pointer-events-none">
                Solte aqui
              </div>
            ) : null}
          </div>
        </div>
      ))}
      <div className="min-w-[20px]" />
    </div>
  );

  const pipelineBody = !ownerId ? (
    <div className="flex-1 p-6 text-xs text-slate-500">
      Aguardando WhatsApp carregar o ownerId para sincronizar.
    </div>
  ) : loading ? (
    <div className="flex-1 p-6 text-xs text-slate-400">Carregando pipeline...</div>
  ) : (
    pipelineBoard
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Pipeline</h2>
          <p className="text-[11px] text-slate-500">Sincronizado com o CRM.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMode('compact');
              setShowFullPanel(false);
            }}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border transition ${
              mode === 'compact'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Compacto
          </button>
          <button
            onClick={openFullPanel}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border transition ${
              mode === 'embedded'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Completo
          </button>
        </div>
      </div>

      {mode === 'embedded' ? (
        <div className="flex-1 p-6 text-xs text-slate-500">
          CRM aberto no painel completo.
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span>Status: {syncState === 'syncing' ? 'Sincronizando' : syncState === 'error' ? 'Erro' : 'OK'}</span>
              {lastSyncAt ? <span>Ultima sync: {new Date(lastSyncAt).toLocaleTimeString()}</span> : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchLeads}
                className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-[10px] font-bold uppercase"
              >
                Atualizar
              </button>
              <button
                onClick={openExternal}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-bold uppercase"
              >
                Abrir CRM
              </button>
            </div>
          </div>

          {pipelineBody}
        </div>
      )}

      {showFullPanel ? (
        <div className="fixed inset-0 z-[999999] pointer-events-auto">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={closeFullPanel} />
          <div className="absolute left-20 right-6 top-6 bottom-6">
            <div
              className="w-full h-full bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Pipeline Completa</h2>
                  <p className="text-[11px] text-slate-500">CRM completo dentro do painel.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={openExternal}
                    className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-[10px] font-bold uppercase"
                  >
                    Abrir CRM
                  </button>
                  <button
                    onClick={closeFullPanel}
                    className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    aria-label="Fechar"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 18L18 6" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-white">
                {!resolvedCrmUrl ? (
                  <div className="h-full flex flex-col">
                    <div className="p-6 text-xs text-slate-500">
                      Configure a URL do CRM nas configuracoes para abrir a pipeline.
                    </div>
                    {pipelineBody}
                  </div>
                ) : embedState === 'error' ? (
                  <div className="h-full flex flex-col">
                    <div className="p-6 text-xs text-slate-500">
                      {embedMessage || 'Nao foi possivel carregar o CRM dentro da extensao.'}
                    </div>
                    {pipelineBody}
                  </div>
                ) : embedState === 'loading' ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Carregando CRM...
                  </div>
                ) : (
                  <iframe title="Pipeline CRM" src={resolvedCrmUrl} className="w-full h-full border-0" />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
