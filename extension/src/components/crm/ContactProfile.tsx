import { useState, useEffect } from 'react';
import type {
    ContactMaster,
    ProfileSkin,
    CrmActivity,
    CrmActivityType,
    CrmIntegration,
    CrmSettings
} from '../../types';
import { WhatsAppScraper, type ChatIdentity, type ChatMessage } from '../../content/scraper';

// Reusable UI Components for consistency
const Section = ({ title, children, skin }: { title: string; children: React.ReactNode; skin: ProfileSkin }) => (
    <div className="mb-6 animate-panel-in">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-1">
            {skin === 'SF' && title === 'Identificação' ? 'Account Details' : title}
        </h3>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

const Input = ({ label, value, onChange, placeholder }: any) => (
    <div>
        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{label}</label>
        <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
        />
    </div>
);

const Select = ({ label, value, onChange, options }: any) => (
    <div>
        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{label}</label>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none"
        >
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

const STATUS_OPTIONS = [
    { value: 'new', label: 'Novo' },
    { value: 'open', label: 'Em andamento' },
    { value: 'won', label: 'Fechado' },
    { value: 'lost', label: 'Perdido' },
];

const STATUS_FROM_API: Record<string, ContactMaster['status']> = {
    Novo: 'new',
    'Em Triagem': 'open',
    'Em andamento': 'open',
    Qualificado: 'open',
    Visita: 'open',
    Proposta: 'open',
    Negociacao: 'open',
    Vendido: 'won',
    Fechado: 'won',
    Perdido: 'lost',
    Arquivado: 'lost',
};

const SOURCE_OPTIONS = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'site', label: 'Site' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'indication', label: 'Indicacao' },
    { value: 'portal', label: 'Portal' },
];

const TEMP_OPTIONS = [
    { value: 'hot', label: 'Quente' },
    { value: 'warm', label: 'Morno' },
    { value: 'cold', label: 'Frio' },
];

const ACTIVITY_LABELS: Record<CrmActivityType, string> = {
    call: 'Ligacao',
    message: 'Mensagem',
    task: 'Tarefa',
    followup: 'Follow-up',
};

const INTEGRATION_OPTIONS: { value: CrmIntegration; label: string }[] = [
    { value: 'bulk', label: 'Envio em massa' },
    { value: 'agenda', label: 'Agenda' },
    { value: 'broadcast', label: 'Disparo' },
    { value: 'automations', label: 'Automacoes' },
];

const FUNNEL_OPTIONS = [
    { value: '', label: 'Selecione' },
    { value: 'novo', label: 'Novo' },
    { value: 'qualificacao', label: 'Qualificacao' },
    { value: 'proposta', label: 'Proposta' },
    { value: 'fechado', label: 'Fechado' },
];

const normalizeList = (value: any) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return [String(value)];
};

const splitCsv = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);
const normalizePhone = (value: string) => value.replace(/\D/g, '');
const normalizeNameKey = (value: string) =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

const getTimeValue = (value?: string | null) => {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
};

const buildStorageKeys = (chat: ChatIdentity) => {
    const keys: string[] = [];
    if (chat.chatId) keys.push(`crm_contact_id_${chat.chatId}`);
    if (chat.phone) keys.push(`crm_contact_phone_${chat.phone}`);
    if (!chat.chatId && !chat.phone && chat.name) keys.push(`crm_contact_name_${chat.name}`);
    if (keys.length === 0) keys.push('crm_contact_unknown');
    return Array.from(new Set(keys));
};

const matchesChatIdentity = (saved: ContactMaster, chat: ChatIdentity | null) => {
    if (!chat) return false;
    const savedPhone = normalizePhone(saved.phone || '');
    const chatPhone = normalizePhone(chat.phone || '');
    if (savedPhone && chatPhone) return savedPhone === chatPhone;
    if (savedPhone || chatPhone) return false;
    const savedName = normalizeNameKey(saved.name || '');
    const chatName = normalizeNameKey(chat.name || '');
    return !!savedName && savedName === chatName;
};

const mapStatusFromApi = (status?: string): ContactMaster['status'] => {
    if (!status) return 'new';
    return STATUS_FROM_API[status] || 'open';
};

const mapStatusToApi = (status: ContactMaster['status']) => {
    const found = STATUS_OPTIONS.find(opt => opt.value === status);
    return found ? found.label : 'Novo';
};

const getCrmAppUrl = (settings?: CrmSettings) => {
    if (!settings) return '';
    if (settings.appUrl) return settings.appUrl;
    if (!settings.baseUrl) return '';
    return settings.baseUrl.replace(/\/api\/?$/, '') + '/#/admin/crm';
};

const buildDefaultProfile = (activeChat: ChatIdentity): ContactMaster => {
    const contactId = activeChat.phone || activeChat.name || `wa_${Date.now()}`;
    return {
        id: contactId,
        name: activeChat.name || 'Novo Contato',
        phone: activeChat.phone || '',
        avatarUrl: activeChat.avatarUrl,
        email: '',
        cpf: '',
        cep: '',
        city: '',
        address: '',
        interestType: 'buy',
        propertyType: 'apartment',
        preferredNeighborhoods: [],
        temperature: 'cold',
        score: 0,
        status: 'new',
        tags: [],
        notes: [],
        skin: 'MA',
        lastInteraction: new Date().toISOString(),
        activities: [],
        deals: [],
        properties: [],
        funnelStage: '',
        autoStatus: true,
        integrations: [],
        origin: 'whatsapp',
    };
};

const mapLeadToContact = (lead: any, activeChat: ChatIdentity): Partial<ContactMaster> => {
    return {
        crmId: lead.id,
        crmUpdatedAt: lead.updatedAt || lead.lastInteraction,
        name: lead.name || activeChat.name,
        phone: lead.phone || activeChat.phone,
        email: lead.email || '',
        status: mapStatusFromApi(lead.status),
        tags: normalizeList(lead.tags),
        notes: normalizeList(lead.notes),
        temperature: lead.temperature === 'hot' || lead.temperature === 'warm' ? lead.temperature : 'cold',
        score: typeof lead.probability === 'number' ? lead.probability : 0,
        origin: lead.source || 'whatsapp',
        lastInteraction: lead.lastInteraction || new Date().toISOString(),
    };
};

const mergeContactData = (current: ContactMaster, incoming: Partial<ContactMaster>) => ({
    ...current,
    ...incoming,
    activities: current.activities?.length ? current.activities : incoming.activities || [],
    deals: current.deals?.length ? current.deals : incoming.deals || [],
    properties: current.properties?.length ? current.properties : incoming.properties || [],
    integrations: current.integrations?.length ? current.integrations : incoming.integrations || [],
});

const mergeContactPreferIncoming = (current: ContactMaster, incoming: Partial<ContactMaster>) => ({
    ...current,
    ...incoming,
    activities: current.activities || incoming.activities || [],
    deals: current.deals || incoming.deals || [],
    properties: current.properties || incoming.properties || [],
    integrations: current.integrations || incoming.integrations || [],
});

function sendRuntimeMessage<T>(message: any): Promise<T> {
    return new Promise((resolve, reject) => {
        try {
            if (typeof chrome === 'undefined' || !chrome.runtime) {
                throw new Error('Chrome runtime not available');
            }
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                if (response && typeof response === 'object' && 'error' in response && response.error) {
                    reject(new Error(String(response.error)));
                    return;
                }
                resolve(response);
            });
        } catch (e) {
            reject(e);
        }
    });
}

export function ContactProfile({ activeChat, crmSettings }: { activeChat: ChatIdentity | null, crmSettings: CrmSettings }) {
    const [data, setData] = useState<ContactMaster | null>(null);
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [crmStatus, setCrmStatus] = useState<'idle' | 'loading' | 'synced' | 'error'>('idle');
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
    const [conversation, setConversation] = useState<ChatMessage[]>([]);
    const [activityDraft, setActivityDraft] = useState<{ type: CrmActivityType; title: string }>({
        type: 'call',
        title: ''
    });

    // Load local data based on active chat
    useEffect(() => {
        if (!activeChat) return;

        setLoading(true);
        const storageKeys = buildStorageKeys(activeChat);

        chrome.storage.local.get(storageKeys).then(result => {
            const saved = storageKeys
                .map((key) => result[key] as ContactMaster | undefined)
                .find((entry) => entry && matchesChatIdentity(entry, activeChat));
            if (saved) {
                setData(saved as ContactMaster);
            } else {
                setData(buildDefaultProfile(activeChat));
            }
        }).finally(() => setLoading(false));
    }, [activeChat]);

    // Fetch data from CRM
    useEffect(() => {
        if (!activeChat) return;
        if (!activeChat.phone && !activeChat.name) return;

        let cancelled = false;
        setCrmStatus('loading');

        const normalizedPhone = normalizePhone(activeChat.phone || '');
        const phoneQuery = normalizedPhone || activeChat.phone;

        sendRuntimeMessage<{ lead?: any }>({
            type: 'FETCH_LEAD',
            phone: phoneQuery,
            name: activeChat.name
        }).then(response => {
            if (cancelled) return;
            if (response?.lead) {
                setData(prev => {
                    const base = prev || buildDefaultProfile(activeChat);
                    const remoteUpdatedAt = getTimeValue(response.lead.updatedAt || response.lead.lastInteraction);
                    const localUpdatedAt = getTimeValue(base.lastInteraction);
                    const incoming = mapLeadToContact(response.lead, activeChat);
                    const merged = remoteUpdatedAt > localUpdatedAt
                        ? mergeContactPreferIncoming(base, incoming)
                        : mergeContactData(base, incoming);
                    const storageKeys = buildStorageKeys(activeChat);
                    const payload = Object.fromEntries(storageKeys.map((key) => [key, merged]));
                    chrome.storage.local.set(payload);
                    return merged;
                });
                setCrmStatus('synced');
            } else {
                setCrmStatus('idle');
            }
        }).catch(() => {
            if (!cancelled) {
                setCrmStatus('error');
            }
        });

        return () => {
            cancelled = true;
        };
    }, [activeChat, crmSettings.baseUrl, crmSettings.token]);

    // Refresh conversation history
    useEffect(() => {
        if (!activeChat) return;
        const updateHistory = () => {
            setConversation(WhatsAppScraper.getRecentMessages(25));
        };

        updateHistory();
        const interval = setInterval(updateHistory, 3000);
        return () => clearInterval(interval);
    }, [activeChat]);

    const handleUpdate = (field: keyof ContactMaster, value: any) => {
        if (!data) return;
        const next = { ...data, [field]: value, lastInteraction: new Date().toISOString() };
        setData(next);
        setSaveStatus('saving');
        setSyncStatus('idle');

        // Autosave
        const storageKeys = activeChat ? buildStorageKeys(activeChat) : [`crm_contact_${data.id}`];
        const payload = Object.fromEntries(storageKeys.map((key) => [key, next]));
        chrome.storage.local.set(payload).then(() => {
            setTimeout(() => setSaveStatus('saved'), 500);
            setTimeout(() => setSaveStatus('idle'), 2000);
        });
    };

    const handleAddActivity = () => {
        if (!data || !activityDraft.title.trim()) return;
        const nextActivity: CrmActivity = {
            id: `act_${Date.now()}`,
            type: activityDraft.type,
            title: activityDraft.title.trim(),
            createdAt: new Date().toISOString()
        };
        const nextList = [nextActivity, ...(data.activities || [])];
        handleUpdate('activities', nextList);
        setActivityDraft({ type: activityDraft.type, title: '' });
    };

    const handleRemoveActivity = (activityId: string) => {
        if (!data) return;
        const nextList = (data.activities || []).filter(activity => activity.id !== activityId);
        handleUpdate('activities', nextList);
    };

    const toggleIntegration = (key: CrmIntegration) => {
        if (!data) return;
        const current = data.integrations || [];
        const next = current.includes(key)
            ? current.filter(item => item !== key)
            : [...current, key];
        handleUpdate('integrations', next);
    };

    const handleSync = async () => {
        if (!data) return;
        if (!data.email || !data.name || !data.phone) {
            setSyncStatus('error');
            return;
        }

        setSyncStatus('syncing');

        const payload = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            status: mapStatusToApi(data.status),
            tags: data.tags,
            notes: data.notes,
            source: data.origin || 'whatsapp',
            temperature: data.temperature,
            interest: data.interestType,
            probability: data.score || 0,
            lastInteraction: data.lastInteraction
        };

        try {
            const response = await sendRuntimeMessage<{ lead?: any }>({
                type: 'SAVE_LEAD',
                leadId: data.crmId,
                payload
            });

            if (response?.lead && activeChat) {
                setData(prev => {
                    if (!prev) return prev;
                    const merged = mergeContactPreferIncoming(prev, mapLeadToContact(response.lead, activeChat));
                    const storageKeys = buildStorageKeys(activeChat);
                    const payload = Object.fromEntries(storageKeys.map((key) => [key, merged]));
                    chrome.storage.local.set(payload);
                    return merged;
                });
            }

            setSyncStatus('synced');
            setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (err) {
            setSyncStatus('error');
        }
    };

    const crmAppUrl = getCrmAppUrl(crmSettings);

    if (loading || !data) return <div className="p-8 text-center text-slate-400 text-xs">Carregando perfil...</div>;

    const statusLabel = STATUS_OPTIONS.find(opt => opt.value === data.status)?.label || 'Novo';
    const canSync = Boolean(data.email && data.name && data.phone);

    const skins: { id: ProfileSkin; label: string; color: string }[] = [
        { id: 'MA', label: 'Master', color: 'bg-brand-600' },
        { id: 'RD', label: 'RD', color: 'bg-indigo-500' },
        { id: 'SF', label: 'SF', color: 'bg-sky-600' },
        { id: 'PD', label: 'PD', color: 'bg-emerald-600' },
        { id: 'TOT', label: 'TOT', color: 'bg-orange-600' },
    ];

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header / Skin Selector */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Modo de Visualização</span>
                <div className="flex gap-1">
                    {skins.map(skin => (
                        <button
                            key={skin.id}
                            onClick={() => handleUpdate('skin', skin.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${data.skin === skin.id ? `${skin.color} text-white shadow-sm` : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                        >
                            {skin.id}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {/* Profile Header */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                        {data.avatarUrl ? <img src={data.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-2xl text-slate-400 font-display">{data.name?.[0] || '?'}</span>}
                    </div>
                    <div>
                        <h2 className="font-display text-lg text-slate-900 leading-tight">{data.name}</h2>
                        <p className="text-xs text-slate-500">{data.phone || 'Sem telefone'}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                {statusLabel}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                {data.origin || 'whatsapp'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${data.temperature === 'hot' ? 'bg-rose-100 text-rose-700' :
                                data.temperature === 'warm' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                {data.temperature.toUpperCase()}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                SCORE {data.score}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6">
                    <button
                        onClick={() => crmAppUrl && window.open(crmAppUrl, '_blank', 'noopener')}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
                        disabled={!crmAppUrl}
                    >
                        Abrir CRM
                    </button>
                    <button
                        onClick={handleSync}
                        className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-brand-200 hover:bg-brand-700 transition disabled:opacity-60"
                        disabled={!canSync || syncStatus === 'syncing'}
                    >
                        {syncStatus === 'syncing' ? 'Enviando...' : 'Enviar ao CRM'}
                    </button>
                    <div className="col-span-2 text-[10px] text-slate-400 flex flex-wrap gap-2">
                        {crmStatus === 'loading' && <span>Buscando CRM...</span>}
                        {crmStatus === 'error' && <span className="text-rose-500">Falha ao buscar CRM.</span>}
                        {syncStatus === 'synced' && <span className="text-emerald-600">CRM sincronizado.</span>}
                        {syncStatus === 'error' && canSync && <span className="text-rose-500">Falha ao enviar para o CRM.</span>}
                        {!canSync && <span className="text-amber-600">Informe nome, email e telefone para enviar.</span>}
                    </div>
                </div>

                {/* Section A: Identification */}
                <Section title="Identificação" skin={data.skin}>
                    <Input label="Email" value={data.email} onChange={(v: string) => handleUpdate('email', v)} placeholder="cliente@email.com" />
                    <Input label="CPF" value={data.cpf} onChange={(v: string) => handleUpdate('cpf', v)} placeholder="000.000.000-00" />
                </Section>

                {/* Section B: Address - Only show for MA and TOT skins */}
                {(data.skin === 'MA' || data.skin === 'TOT') && (
                    <Section title="Endereço" skin={data.skin}>
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="CEP" value={data.cep || ''} onChange={(v: string) => handleUpdate('cep', v)} />
                            <Input label="Cidade" value={data.city || ''} onChange={(v: string) => handleUpdate('city', v)} />
                        </div>
                        <Input label="Endereço" value={data.address || ''} onChange={(v: string) => handleUpdate('address', v)} />
                    </Section>
                )}

                {/* Section C: Real Estate - Priority for PD and MA */}
                <Section title="Perfil Imobiliário" skin={data.skin}>
                    <div className="grid grid-cols-2 gap-2">
                        <Select
                            label="Interesse"
                            value={data.interestType}
                            onChange={(v: any) => handleUpdate('interestType', v)}
                            options={[{ value: 'buy', label: 'Compra' }, { value: 'rent', label: 'Aluguel' }, { value: 'invest', label: 'Investimento' }]}
                        />
                        <Select
                            label="Tipo"
                            value={data.propertyType}
                            onChange={(v: any) => handleUpdate('propertyType', v)}
                            options={[{ value: 'house', label: 'Casa' }, { value: 'apartment', label: 'Apartamento' }, { value: 'land', label: 'Terreno' }]}
                        />
                    </div>
                    <Input label="Bairros de interesse" value={data.preferredNeighborhoods?.join(', ') || ''} onChange={(v: string) => handleUpdate('preferredNeighborhoods', v.split(','))} placeholder="Ex: Centro, Jardins" />
                </Section>

                <Section title="CRM e Status" skin={data.skin}>
                    <div className="grid grid-cols-2 gap-2">
                        <Select
                            label="Status do lead"
                            value={data.status}
                            onChange={(v: any) => handleUpdate('status', v)}
                            options={STATUS_OPTIONS}
                        />
                        <Select
                            label="Origem"
                            value={data.origin || 'whatsapp'}
                            onChange={(v: any) => handleUpdate('origin', v)}
                            options={SOURCE_OPTIONS}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Select
                            label="Temperatura"
                            value={data.temperature}
                            onChange={(v: any) => handleUpdate('temperature', v)}
                            options={TEMP_OPTIONS}
                        />
                        <Input
                            label="Score"
                            value={data.score || 0}
                            onChange={(v: string) => handleUpdate('score', Number(v) || 0)}
                            placeholder="0-100"
                        />
                    </div>
                    <Input
                        label="Tags"
                        value={(data.tags || []).join(', ')}
                        onChange={(v: string) => handleUpdate('tags', splitCsv(v))}
                        placeholder="Ex: VIP, quente"
                    />
                </Section>

                <Section title="Vinculos" skin={data.skin}>
                    <Input
                        label="Negocios"
                        value={(data.deals || []).join(', ')}
                        onChange={(v: string) => handleUpdate('deals', splitCsv(v))}
                        placeholder="Ex: N001, N002"
                    />
                    <Input
                        label="Imoveis"
                        value={(data.properties || []).join(', ')}
                        onChange={(v: string) => handleUpdate('properties', splitCsv(v))}
                        placeholder="Ex: IMV-10, IMV-22"
                    />
                    <Select
                        label="Funil de vendas"
                        value={data.funnelStage || ''}
                        onChange={(v: any) => handleUpdate('funnelStage', v)}
                        options={FUNNEL_OPTIONS}
                    />
                </Section>

                <Section title="Automacao e Integracoes" skin={data.skin}>
                    <div className="grid grid-cols-2 gap-2">
                        {INTEGRATION_OPTIONS.map(option => (
                            <label key={option.value} className="flex items-center gap-2 text-xs text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={(data.integrations || []).includes(option.value)}
                                    onChange={() => toggleIntegration(option.value)}
                                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                />
                                <span>{option.label}</span>
                            </label>
                        ))}
                    </div>
                </Section>

                <Section title="Registro de atividades" skin={data.skin}>
                    <div className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
                        <select
                            value={activityDraft.type}
                            onChange={e => setActivityDraft({ ...activityDraft, type: e.target.value as CrmActivityType })}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        >
                            {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <input
                            value={activityDraft.title}
                            onChange={e => setActivityDraft({ ...activityDraft, title: e.target.value })}
                            placeholder="Detalhe da atividade"
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                        <button
                            onClick={handleAddActivity}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                        >
                            +
                        </button>
                    </div>

                    <div className="space-y-2">
                        {(data.activities || []).length === 0 && (
                            <p className="text-xs text-slate-400">Sem atividades registradas.</p>
                        )}
                        {(data.activities || []).map(activity => (
                            <div key={activity.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
                                <div>
                                    <p className="font-bold text-slate-700">{ACTIVITY_LABELS[activity.type]}</p>
                                    <p className="text-[10px] text-slate-500">{activity.title}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400">{activity.createdAt.split('T')[0]}</span>
                                    <button
                                        onClick={() => handleRemoveActivity(activity.id)}
                                        className="text-slate-300 hover:text-rose-500 transition"
                                        title="Remover"
                                    >
                                        x
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                <Section title="Historico de conversas" skin={data.skin}>
                    {conversation.length === 0 && (
                        <p className="text-xs text-slate-400">Sem conversas carregadas.</p>
                    )}
                    {conversation.length > 0 && (
                        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                            {conversation.map(msg => (
                                <div key={msg.id} className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg px-2 py-1 text-[11px] ${msg.direction === 'out' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-700'}`}>
                                        <p>{msg.text}</p>
                                        {msg.timestamp && (
                                            <span className="block text-[9px] text-slate-400 mt-0.5">{msg.timestamp}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {/* Section D: Notes (All Skins) */}
                <Section title="Anotações" skin={data.skin}>
                    <textarea
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 min-h-[80px]"
                        placeholder="Escreva uma nota..."
                        value={(data.notes || []).join('\n')}
                        onChange={e => handleUpdate('notes', e.target.value.split('\n'))}
                    />
                </Section>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-300 font-mono">
                <span>ID: {data.id} • Skin: {data.skin}</span>
                <span className={`font-bold transition-colors ${saveStatus === 'saved' ? 'text-emerald-500' : saveStatus === 'saving' ? 'text-amber-500' : 'opacity-0'}`}>
                    {saveStatus === 'saving' ? 'Salvando...' : 'Salvo'}
                </span>
            </div>
        </div>
    );
}
