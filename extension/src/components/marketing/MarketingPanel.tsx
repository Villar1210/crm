import { useEffect, useMemo, useState } from 'react';
import { WhatsAppScraper } from '../../content/scraper';

type Contact = {
    id: string;
    name: string;
    phone: string;
    source?: string;
    isMyContact?: boolean;
};

type Campaign = {
    id: string;
    name: string;
    subject?: string;
    status?: string;
    preheader?: string;
    source?: 'crm' | 'local';
    payload?: LocalCampaign;
};

type Property = {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    price?: number;
    rentPrice?: number;
    images?: string[];
};

type ContentTab = 'message' | 'campaigns' | 'properties';

type LoadState = 'idle' | 'loading' | 'error';

type SendState = 'idle' | 'sending' | 'done' | 'error';

type SendStatus = 'idle' | 'sending' | 'sent' | 'error';

type LocalCampaign = {
    id: string;
    title: string;
    message: string;
    contentTab: ContentTab;
    audienceSource: 'crm' | 'recent';
    recipients: Contact[];
    selectedCampaignId?: string;
    selectedPropertyIds?: string[];
    createdAt: string;
    updatedAt: string;
};

const CONTENT_TABS: { id: ContentTab; label: string }[] = [
    { id: 'message', label: 'Mensagem' },
    { id: 'campaigns', label: 'Campanhas' },
    { id: 'properties', label: 'Imoveis' },
];

const VARIABLE_TOKENS = ['{{nome}}', '{{telefone}}', '{{corretor}}'];
const DEFAULT_AGENT_NAME = 'Equipe';
const BROADCAST_DEBUG = true;
const LOCAL_CAMPAIGNS_KEY = 'crm_broadcast_campaigns_v1';

const logBroadcast = (...args: any[]) => {
    if (BROADCAST_DEBUG) console.log('[CRM BROADCAST]', ...args);
};

const normalizePhone = (value: string) => value.replace(/\D/g, '');

const isSystemPhone = (value: string) => {
    const digits = normalizePhone(String(value || ''));
    if (!digits) return false;
    return /^1\d{3}5550\d{3}$/.test(digits) || /^\d{3}5550\d{3}$/.test(digits);
};

const isSystemContact = (name: string, phone: string) => {
    const digits = normalizePhone(String(phone || ''));
    if (digits && (digits.length < 8 || digits.length > 13)) return true;
    const key = String(name || '').toLowerCase();
    if (key.includes('meta ai') || key.includes('whatsapp') || key.includes('support')) return true;
    return isSystemPhone(digits);
};

const formatCurrency = (value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPhoneNumber = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');

    // HIDE INTERNAL IDs: If it has more than 13 digits, likely a serialized ID (e.g. 191538...).
    // User requested to hide these technical numbers.
    if (numbers.length > 13) return '';

    // Check for Brazilian format (12 or 13 digits starting with 55)
    if (numbers.startsWith('55') && (numbers.length === 12 || numbers.length === 13)) {
        // 55 AA XXXXX XXXX
        const ddd = numbers.substring(2, 4);
        const rest = numbers.substring(4);
        if (rest.length === 8) {
            return `+55 (${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
        } else if (rest.length === 9) {
            return `+55 (${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
        }
    }
    // Check for local format (10 or 11 digits)
    if (numbers.length === 10) {
        return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`;
    }
    if (numbers.length === 11) {
        return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`;
    }

    return phone;
};

const buildPropertySnippet = (items: Property[]) => {
    if (!items.length) return '';
    return items
        .map((property) => {
            const label = `${property.title} - ${property.city}/${property.state}`;
            const price = property.price ? formatCurrency(property.price) : '';
            const rent = property.rentPrice ? formatCurrency(property.rentPrice) : '';
            const extra = price || rent ? ` (${price || rent})` : '';
            return `- ${label}${extra}`;
        })
        .join('\n');
};

const buildCampaignSnippet = (campaign: Campaign | null) => {
    if (!campaign) return '';
    const title = campaign.subject || campaign.name;
    const preheader = campaign.preheader ? `\n${campaign.preheader}` : '';
    return `${title}${preheader}`.trim();
};

const applyTokens = (template: string, contact: Contact | null, agentName: string) => {
    const safeName = contact?.name || 'Cliente';
    const safePhone = contact?.phone || '';
    return template
        .replace(/{{\s*nome\s*}}/gi, safeName)
        .replace(/{{\s*telefone\s*}}/gi, safePhone)
        .replace(/{{\s*corretor\s*}}/gi, agentName || DEFAULT_AGENT_NAME);
};

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
        } catch (error) {
            reject(error);
        }
    });
}

function SyncButton({ onSyncSuccess }: { onSyncSuccess: () => void }) {
    const [status, setStatus] = useState<'idle' | 'syncing' | 'done'>('idle');
    const [count, setCount] = useState(0);

    const handleSync = async () => {
        if (status === 'syncing') return;
        setStatus('syncing');
        setCount(0);

        try {
            await WhatsAppScraper.syncAddressBook((newCount: number) => {
                setCount(newCount);
            }, { mode: 'cache' });
            setStatus('done');
            onSyncSuccess(); // Trigger reload
            setTimeout(() => setStatus('idle'), 3000);
        } catch (e) {
            console.error(e);
            setStatus('idle');
            alert('Erro ao sincronizar. Tente recarregar a pagina.');
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={status === 'syncing'}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition
                ${status === 'syncing'
                    ? 'bg-brand-50 border-brand-200 text-brand-700'
                    : status === 'done'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }
            `}
        >
            {status === 'syncing' ? (
                <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sincronizando... ({count})</span>
                </>
            ) : status === 'done' ? (
                <>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span>Concluido ({count})</span>
                </>
            ) : (
                <>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Sincronizar Agenda</span>
                </>
            )}
        </button>
    );
}

export function MarketingPanel({ onClose }: { onClose: () => void }) {
    const [contentTab, setContentTab] = useState<ContentTab>('message');
    const [activeSource, setActiveSource] = useState<'crm' | 'recent'>('crm');
    const [query, setQuery] = useState('');
    const [campaignTitle, setCampaignTitle] = useState('');
    const [message, setMessage] = useState('');
    const [localCampaigns, setLocalCampaigns] = useState<LocalCampaign[]>([]);
    const [selectedLocalCampaignId, setSelectedLocalCampaignId] = useState('');
    const [extraContacts, setExtraContacts] = useState<Contact[]>([]);

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [recentChats, setRecentChats] = useState<Contact[]>([]);
    const [contactsState, setContactsState] = useState<LoadState>('idle');
    const [contactsError, setContactsError] = useState('');

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [campaignsState, setCampaignsState] = useState<LoadState>('idle');
    const [properties, setProperties] = useState<Property[]>([]);
    const [propertiesState, setPropertiesState] = useState<LoadState>('idle');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedCampaignId, setSelectedCampaignId] = useState('');
    const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(new Set());
    const [sendState, setSendState] = useState<SendState>('idle');
    const [sendStatusById, setSendStatusById] = useState<Record<string, SendStatus>>({});
    const [ownerId, setOwnerId] = useState<string | null>(null);

    useEffect(() => {
        setContacts([]);
        setRecentChats([]);
        setSelectedIds(new Set());
        setExtraContacts([]);
        setSelectedLocalCampaignId('');
    }, [ownerId]);

    useEffect(() => {
        let cancelled = false;
        let attempts = 0;
        let warned = false;

        // Fetch Owner ID with retry; keep trying so auto-sync can run later.
        const fetchOwner = async () => {
            while (!cancelled) {
                const id = await WhatsAppScraper.getMe();
                if (id) {
                    console.log('[CRM] Owner ID FOUND:', id);
                    setContactsError('');
                    setOwnerId(id);
                    return;
                }

                attempts += 1;
                if (!warned && attempts >= 10) {
                    warned = true;
                    console.error('[CRM] Failed to get Owner ID');
                    setContactsError('Nao foi possivel identificar seu usuario. Recarregue a pagina.');
                }

                await new Promise(r => setTimeout(r, 1000));
            }
        };

        fetchOwner();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
        chrome.storage.local.get(LOCAL_CAMPAIGNS_KEY).then((res) => {
            const stored = res?.[LOCAL_CAMPAIGNS_KEY];
            if (Array.isArray(stored)) {
                setLocalCampaigns(stored as LocalCampaign[]);
            }
        });
    }, []);

    // AUTO-SYNC EFFECT
    useEffect(() => {
        if (!ownerId) return;

        const globalState = (window as any).__IVILLAR_AUTO_SYNC_STATE__;
        if (globalState === 'running' || globalState === 'done') {
            return;
        }
        (window as any).__IVILLAR_AUTO_SYNC_STATE__ = 'running';

        WhatsAppScraper.syncAddressBook((c) => console.log('Auto-sync progress:', c), { mode: 'cache' })
            .then((count) => {
                console.log('[CRM] Auto-Sync completed:', count);
                loadContacts(); // Refresh DB view
            })
            .catch((err) => {
                console.error('[CRM] Auto-sync failed', err);
            })
            .finally(() => {
                (window as any).__IVILLAR_AUTO_SYNC_STATE__ = 'done';
            });
    }, [ownerId]);

    const loadContacts = async () => {
        setContactsState('loading');
        setContactsError('');
        const currentOwnerId = ownerId || undefined;
        console.log('[CRM DEBUG] loadContacts called. OwnerID:', currentOwnerId);

        if (!currentOwnerId) {
            console.warn('[CRM DEBUG] Skipping loadContacts because OwnerID is missing');
            setContacts([]);
            setContactsState('idle');
            return;
        }

        try {
            const payload = await WhatsAppScraper.getWppContacts();
            const seen = new Set<string>();
            const mapped = (Array.isArray(payload) ? payload : [])
                .map((contact) => {
                    let phone = normalizePhone(String(contact?.phone || ''));
                    if (!phone && typeof contact?.id === 'string' && contact.id.includes('@')) {
                        phone = normalizePhone(contact.id.split('@')[0]);
                    }
                    const name = String(contact?.name || 'Contato');
                    return {
                        id: String(contact?.id || phone || name),
                        name,
                        phone,
                        source: 'WhatsApp',
                        isMyContact: contact?.isMyContact === true
                    } as Contact;
                })
                .filter((contact) => {
                    if (!contact.phone) return false;
                    if (seen.has(contact.phone)) return false;
                    if (isSystemContact(contact.name, contact.phone)) return false;
                    if (isSystemPhone(contact.phone)) return false;
                    seen.add(contact.phone);
                    return true;
                });

            const strictContacts = mapped.filter((contact) => contact.isMyContact);
            setContacts(strictContacts.length ? strictContacts : mapped);
            setContactsState('idle');
        } catch (error) {
            console.error('WPP contacts error:', error);
            setContactsError('Falha ao carregar contatos do WhatsApp. Recarregue a pagina.');
            setContactsState('error');
        }
    };

    const persistLocalCampaigns = (next: LocalCampaign[]) => {
        setLocalCampaigns(next);
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.set({ [LOCAL_CAMPAIGNS_KEY]: next });
        }
    };

    const applyLocalCampaign = (campaign: LocalCampaign) => {
        setSelectedLocalCampaignId(campaign.id);
        setCampaignTitle(campaign.title || '');
        setMessage(campaign.message || '');
        setContentTab(campaign.contentTab || 'message');
        setSelectedCampaignId(campaign.selectedCampaignId || '');
        setSelectedPropertyIds(new Set(campaign.selectedPropertyIds || []));
        setExtraContacts(Array.isArray(campaign.recipients) ? campaign.recipients : []);
        setSelectedIds(new Set((campaign.recipients || []).map((item) => item.id)));
        if (campaign.audienceSource) {
            setActiveSource(campaign.audienceSource);
        }
    };


    {/*
    const handleClearDatabase = async () => {
        if (!confirm('ATENÇÃO: Isso apagará TODOS os contatos salvos no sistema para sua conta.\n\nUse isso se sua agenda estiver "suja" com canais ou grupos antigos.\n\nDeseja continuar?')) return;

        setContactsState('loading');
        try {
            const owner = ownerId || undefined;
            if (!owner) throw new Error('Usuário não identificado');

            await sendRuntimeMessage({ type: 'DELETE_ALL_LEADS', ownerId: owner });

            // Clear local state
            setContacts([]);
            alert('Banco de dados limpo com sucesso! Clique em "Sincronizar" para puxar a agenda atualizada.');
            setContactsState('idle');
        } catch (e: any) {
            console.error('Clear DB failed', e);
            setContactsError('Erro ao limpar banco: ' + String(e.message || e));
            setContactsState('error');
        }
    };
    */}


    const loadRecentChats = async () => {
        setContactsState('loading');
        try {
            const chats = await WhatsAppScraper.getWppChats();
            const seen = new Set<string>();
            const mapped = chats
                .map((chat: any) => ({
                    id: chat.id,
                    name: chat.name || chat.phone || 'Sem Nome',
                    phone: chat.phone,
                    source: 'WhatsApp'
                }))
                .filter((contact: any) => {
                    // DEDUPLICATE: Remove invalid or duplicate phones
                    if (!contact.phone && !contact.id) return false;

                    const key = contact.id || contact.phone;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

            setRecentChats(mapped);
            setContactsState('idle');
        } catch (e) {
            console.error('Recent chats error', e);
            setContactsState('error');
        }
    };

    useEffect(() => {
        if (activeSource === 'recent') {
            loadRecentChats();
        } else {
            // Only load CRM contacts if we have an Owner ID (prevents leakage)
            if (ownerId) {
                loadContacts();
            }
        }
    }, [activeSource, ownerId]);

    useEffect(() => {
        let active = true;
        setCampaignsState('loading');
        sendRuntimeMessage<{ campaigns?: any[] }>({ type: 'FETCH_CAMPAIGNS' })
            .then((response) => {
                if (!active) return;
                const payload = Array.isArray(response?.campaigns) ? response.campaigns : [];
                const mapped = payload.map((campaign) => ({
                    id: String(campaign?.id || ''),
                    name: String(campaign?.name || 'Campanha'),
                    subject: campaign?.subject ? String(campaign.subject) : undefined,
                    status: campaign?.status ? String(campaign.status) : undefined,
                    preheader: campaign?.preheader ? String(campaign.preheader) : undefined,
                    source: 'crm' as const,
                }));
                setCampaigns(mapped.filter((item) => item.id));
                setCampaignsState('idle');
            })
            .catch(() => {
                if (active) setCampaignsState('error');
            });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        setPropertiesState('loading');
        sendRuntimeMessage<{ properties?: any[] }>({ type: 'FETCH_PROPERTIES' })
            .then((response) => {
                if (!active) return;
                const payload = Array.isArray(response?.properties) ? response.properties : [];
                const mapped = payload.map((property) => ({
                    id: String(property?.id || ''),
                    title: String(property?.title || 'Imovel'),
                    address: String(property?.address || ''),
                    city: String(property?.city || ''),
                    state: String(property?.state || ''),
                    price: typeof property?.price === 'number' ? property.price : undefined,
                    rentPrice: typeof property?.rentPrice === 'number' ? property.rentPrice : undefined,
                    images: Array.isArray(property?.images) ? property.images : [],
                }));
                setProperties(mapped.filter((item) => item.id));
                setPropertiesState('idle');
            })
            .catch(() => {
                if (active) setPropertiesState('error');
            });
        return () => {
            active = false;
        };
    }, []);

    const campaignOptions = useMemo(() => {
        const localMapped = localCampaigns.map((campaign) => ({
            id: campaign.id,
            name: campaign.title,
            subject: campaign.title,
            status: 'Lista',
            preheader: campaign.message ? String(campaign.message).split('\n')[0] : undefined,
            source: 'local' as const,
            payload: campaign
        }));
        return [...localMapped, ...campaigns];
    }, [localCampaigns, campaigns]);

    useEffect(() => {
        setSelectedPropertyIds((prev) => {
            const valid = new Set(properties.map((property) => property.id));
            return new Set([...prev].filter((id) => valid.has(id)));
        });
    }, [properties]);

    const baseContacts = activeSource === 'recent' ? recentChats : contacts;

    const mergedContacts = useMemo(() => {
        const combined = [...baseContacts];
        const seen = new Set(baseContacts.map((contact) => contact.id));
        extraContacts.forEach((contact) => {
            if (!contact?.id || seen.has(contact.id)) return;
            seen.add(contact.id);
            combined.push(contact);
        });
        return combined;
    }, [baseContacts, extraContacts]);

    useEffect(() => {
        setSelectedIds((prev) => {
            const valid = new Set(mergedContacts.map((contact) => contact.id));
            return new Set([...prev].filter((id) => valid.has(id)));
        });
    }, [mergedContacts]);

    const filteredContacts = useMemo(() => {
        if (!query.trim()) return mergedContacts;
        const term = query.toLowerCase();
        return mergedContacts.filter((contact) =>
            `${contact.name} ${contact.phone} ${contact.source || ''}`.toLowerCase().includes(term)
        );
    }, [mergedContacts, query]);

    const selectedContacts = useMemo(
        () => mergedContacts.filter((contact) => selectedIds.has(contact.id)),
        [mergedContacts, selectedIds]
    );

    const selectedCampaign = useMemo(
        () => campaigns.find((campaign) => campaign.id === selectedCampaignId) || null,
        [campaigns, selectedCampaignId]
    );

    const selectedProperties = useMemo(
        () => properties.filter((property) => selectedPropertyIds.has(property.id)),
        [properties, selectedPropertyIds]
    );

    const toggleContact = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleProperty = (id: string) => {
        setSelectedPropertyIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleAll = () => {
        setSelectedIds(() => {
            const allIds = new Set(mergedContacts.map(c => c.id));
            if (selectedIds.size === allIds.size) return new Set(); // Deselect all
            return allIds;
        });
    };

    const allSelected = mergedContacts.length > 0 && selectedIds.size === mergedContacts.length;

    const handleSelectCampaign = (campaign: Campaign) => {
        if (campaign.source === 'local' && campaign.payload) {
            applyLocalCampaign(campaign.payload);
            return;
        }
        setSelectedLocalCampaignId('');
        setExtraContacts([]);
        setSelectedCampaignId(campaign.id);
    };

    const handleSaveDraft = () => {
        const title = campaignTitle.trim();
        if (!title) {
            alert('Defina um titulo interno para salvar.');
            return;
        }
        if (selectedContacts.length === 0) {
            alert('Selecione pelo menos um contato para salvar a lista.');
            return;
        }

        const recipients = selectedContacts.map((contact) => ({
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            source: contact.source,
            isMyContact: contact.isMyContact
        }));

        const existing = localCampaigns.find((item) => item.id === selectedLocalCampaignId);
        const now = new Date().toISOString();

        const payload: LocalCampaign = {
            id: existing?.id || `${Date.now()}`,
            title,
            message,
            contentTab,
            audienceSource: activeSource,
            recipients,
            selectedCampaignId: contentTab === 'campaigns' ? selectedCampaignId : undefined,
            selectedPropertyIds: contentTab === 'properties' ? [...selectedPropertyIds] : undefined,
            createdAt: existing?.createdAt || now,
            updatedAt: now
        };

        const next = existing
            ? localCampaigns.map((item) => (item.id === payload.id ? payload : item))
            : [payload, ...localCampaigns];

        persistLocalCampaigns(next);
        setSelectedLocalCampaignId(payload.id);
        setExtraContacts(payload.recipients);
        alert('Lista salva com sucesso.');
    };

    const contentLabel =
        contentTab === 'message' ? 'Mensagem' : contentTab === 'campaigns' ? 'Campanha' : 'Imoveis';

    const contentSnippet = useMemo(() => {
        if (contentTab === 'campaigns') return buildCampaignSnippet(selectedCampaign);
        if (contentTab === 'properties') return buildPropertySnippet(selectedProperties);
        return '';
    }, [contentTab, selectedCampaign, selectedProperties]);

    const combinedMessage = useMemo(() => {
        const base = message.trim();
        const parts = [base, contentSnippet].filter(Boolean);
        return parts.join('\n\n');
    }, [message, contentSnippet]);

    const previewContact = selectedContacts[0] || null;
    const previewMessage = combinedMessage
        ? applyTokens(combinedMessage, previewContact, DEFAULT_AGENT_NAME)
        : 'Digite uma mensagem para visualizar a previa.';

    const canSend = selectedIds.size > 0 && combinedMessage.trim().length > 0 && sendState !== 'sending';

    const sendStats = useMemo(() => {
        const statuses = Object.values(sendStatusById);
        return {
            sent: statuses.filter((status) => status === 'sent').length,
            error: statuses.filter((status) => status === 'error').length,
        };
    }, [sendStatusById]);

    const handleSend = async () => {
        if (!canSend) return;
        const contactsToSend = selectedContacts;
        if (!contactsToSend.length) return;

        let sentCount = 0;
        let errorCount = 0;

        logBroadcast('invisible send start', {
            contacts: contactsToSend.length,
            contentTab
        });

        setSendState('sending');
        setSendStatusById({});

        await new Promise(r => setTimeout(r, 100));

        for (const contact of contactsToSend) {
            setSendStatusById((prev) => ({ ...prev, [contact.id]: 'sending' }));
            logBroadcast('sending to', contact.phone);

            try {
                const normalizedPhone = normalizePhone(contact.phone);
                if (!normalizedPhone || normalizedPhone.length < 8) {
                    throw new Error('Telefone invalido');
                }

                const finalMessage = applyTokens(combinedMessage, contact, DEFAULT_AGENT_NAME);
                if (!finalMessage.trim()) throw new Error('Mensagem vazia');

                // INVISIBLE SEND via WPPConnect
                // If the contact ID is a WPP Serialized ID (contains @), pass it directly to avoid reconstruction errors
                const chatId = contact.id.includes('@') ? contact.id : undefined;
                const sent = await WhatsAppScraper.sendInvisible(normalizedPhone, finalMessage, chatId);

                if (!sent) throw new Error('WPP falhou no envio');

                setSendStatusById((prev) => ({ ...prev, [contact.id]: 'sent' }));
                logBroadcast('send success', contact.id);
                sentCount++;

            } catch (error) {
                console.error(`Send error for ${contact.name}:`, error);
                setSendStatusById((prev) => ({ ...prev, [contact.id]: 'error' }));
                errorCount++;
            }

            // Small delay to be polite to WPP
            await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 500));
        }

        setSendState('done');
        logBroadcast('send done', { sent: sentCount, error: errorCount });
        setTimeout(() => setSendState('idle'), 2500);
    };

    return (
        <div className="fixed inset-0 z-[999999] pointer-events-auto">
            <div
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="absolute left-20 right-6 top-6 bottom-6">
                <div
                    className="w-full h-full bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="flex-1 p-6 overflow-hidden">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Disparos em Massa</h2>
                                <p className="text-xs text-slate-500">
                                    Selecione contatos, defina o conteudo e revise a previa antes de enviar.
                                </p>
                                {/* DEBUG INFO HIDDEN */}
                                {/* <p className="text-[10px] font-mono text-red-500 mt-1">
                                    DEBUG: v2.1 | Owner: {ownerId || 'BUSCANDO...'} | Mode: {activeSource}
                                </p> */}
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-full border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
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

                        <div className="flex justify-end mb-4 hidden">
                            <SyncButton onSyncSuccess={loadContacts} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4 h-full">
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col min-h-0">
                                <div className="flex items-center justify-between mb-3">
                                    {/* TABS */}
                                    <div className="flex bg-slate-100 p-1 rounded-lg invisible h-0 w-0 overflow-hidden">
                                        {/* Placeholder to keep layout structure if needed, or just remove. Removing for cleanliness is better, but to avoid breaking grid if row depends on it, I'll just remove the content. */}
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-500">
                                        {selectedIds.size} selecionados
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="relative flex-1">
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="m21 21-4.3-4.3" />
                                        </svg>
                                        <input
                                            value={query}
                                            onChange={(event) => setQuery(event.target.value)}
                                            placeholder="Buscar contatos..."
                                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setQuery('')}
                                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Limpar
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mb-3">
                                    {/* Moved Tabs Here */}
                                    <div className="flex bg-slate-100 p-1 rounded-lg w-full">
                                        <button
                                            onClick={() => setActiveSource('crm')}
                                            className={`flex-1 px-3 py-1 text-[10px] font-semibold rounded-md transition ${activeSource === 'crm' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Contatos (Salvos)
                                        </button>
                                        <button
                                            onClick={() => setActiveSource('recent')}
                                            className={`flex-1 px-3 py-1 text-[10px] font-semibold rounded-md transition ${activeSource === 'recent' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Recentes (Todos)
                                        </button>
                                    </div>
                                </div>

                                {/* Buttons removed per user request
                                {activeSource === 'crm' && (
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <button
                                            onClick={handleClearDatabase}
                                            className="text-[10px] text-red-500 hover:text-red-700 underline"
                                            title="Apagar todos os contatos do banco de dados deste usuário"
                                        >
                                            Limpar Banco de Dados
                                        </button>
                                        <SyncButton onSyncSuccess={() => loadContacts()} />
                                    </div>
                                )}
                                */}
                                <div className="flex items-center justify-between mb-3">
                                    <button
                                        type="button"
                                        onClick={toggleAll}
                                        className="text-[10px] font-semibold text-brand-600 hover:underline"
                                    >
                                        {allSelected ? 'Remover selecao' : 'Selecionar todos'}
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {contactsState === 'loading' ? (
                                        <p className="text-xs text-slate-400">Carregando contatos...</p>
                                    ) : null}
                                    {contactsState === 'error' ? (
                                        <div className="p-2 bg-rose-50 rounded-lg border border-rose-100">
                                            <p className="text-xs text-rose-600 mb-1">
                                                Falha ao carregar contatos.
                                            </p>
                                            <p className="text-[10px] text-rose-500 mb-2">
                                                {contactsError}
                                            </p>
                                            <button
                                                onClick={loadContacts}
                                                className="text-xs font-semibold text-rose-700 underline hover:text-rose-800"
                                            >
                                                Tentar novamente
                                            </button>
                                        </div>
                                    ) : null}
                                    {contactsState === 'idle' && filteredContacts.length === 0 ? (
                                        <p className="text-xs text-slate-400">Nenhum contato encontrado.</p>
                                    ) : null}
                                    {filteredContacts.map((contact) => {
                                        const isSelected = selectedIds.has(contact.id);
                                        return (
                                            <button
                                                key={contact.id}
                                                type="button"
                                                onClick={() => toggleContact(contact.id)}
                                                className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left transition ${isSelected
                                                    ? 'border-brand-500 bg-brand-50/50'
                                                    : 'border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleContact(contact.id)}
                                                    onClick={(event) => event.stopPropagation()}
                                                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                                        {contact.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {formatPhoneNumber(contact.phone) || contact.phone || ''}
                                                    </p>
                                                </div>
                                                <span className="ml-auto text-[9px] uppercase tracking-wide text-slate-400">
                                                    {contact.source || 'CRM'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col min-h-0">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Conteudo do disparo</p>
                                        <p className="text-[10px] text-slate-500">Mensagem, campanha ou imoveis.</p>
                                    </div>
                                    <div className="inline-flex items-center rounded-full bg-slate-100 p-1 gap-1">
                                        {CONTENT_TABS.map((tab) => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setContentTab(tab.id)}
                                                className={`px-3 py-1 rounded-full text-[10px] font-semibold transition ${contentTab === tab.id
                                                    ? 'bg-white text-slate-900 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-500 uppercase">
                                            Titulo interno
                                        </label>
                                        <input
                                            value={campaignTitle}
                                            onChange={(event) => setCampaignTitle(event.target.value)}
                                            placeholder="Ex: Campanha de Maio"
                                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                        />
                                    </div>

                                    {contentTab === 'campaigns' ? (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase">Campanhas</p>
                                            <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                                                {campaignsState === 'loading' ? (
                                                    <p className="text-xs text-slate-400">Carregando campanhas...</p>
                                                ) : null}
                                                {campaignsState === 'error' ? (
                                                    <p className="text-xs text-rose-500">Falha ao carregar campanhas.</p>
                                                ) : null}
                                                {campaignsState === 'idle' && campaignOptions.length === 0 ? (
                                                    <p className="text-xs text-slate-400">Nenhuma campanha encontrada.</p>
                                                ) : null}
                                                {campaignOptions.map((campaign) => {
                                                    const isSelected = campaign.source === 'local'
                                                        ? campaign.id === selectedLocalCampaignId
                                                        : !selectedLocalCampaignId && campaign.id === selectedCampaignId;
                                                    return (
                                                        <button
                                                            key={campaign.id}
                                                            type="button"
                                                            onClick={() => handleSelectCampaign(campaign)}
                                                            className={`w-full flex items-start gap-3 p-2 rounded-xl border text-left transition ${isSelected
                                                                ? 'border-brand-500 bg-brand-50/50'
                                                                : 'border-slate-200 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                checked={isSelected}
                                                                onChange={() => handleSelectCampaign(campaign)}
                                                                onClick={(event) => event.stopPropagation()}
                                                                className="mt-1 h-4 w-4 text-brand-600"
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-semibold text-slate-900 truncate">
                                                                    {campaign.subject || campaign.name}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 truncate">
                                                                    {campaign.name}
                                                                </p>
                                                            </div>
                                                            {campaign.status ? (
                                                                <span className="ml-auto text-[9px] uppercase tracking-wide text-slate-400">
                                                                    {campaign.status}
                                                                </span>
                                                            ) : null}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : null}

                                    {contentTab === 'properties' ? (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase">Imoveis</p>
                                            <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                                                {propertiesState === 'loading' ? (
                                                    <p className="text-xs text-slate-400">Carregando imoveis...</p>
                                                ) : null}
                                                {propertiesState === 'error' ? (
                                                    <p className="text-xs text-rose-500">Falha ao carregar imoveis.</p>
                                                ) : null}
                                                {propertiesState === 'idle' && properties.length === 0 ? (
                                                    <p className="text-xs text-slate-400">Nenhum imovel encontrado.</p>
                                                ) : null}
                                                {properties.map((property) => {
                                                    const isSelected = selectedPropertyIds.has(property.id);
                                                    return (
                                                        <button
                                                            key={property.id}
                                                            type="button"
                                                            onClick={() => toggleProperty(property.id)}
                                                            className={`w-full flex items-start gap-3 p-2 rounded-xl border text-left transition ${isSelected
                                                                ? 'border-brand-500 bg-brand-50/50'
                                                                : 'border-slate-200 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleProperty(property.id)}
                                                                onClick={(event) => event.stopPropagation()}
                                                                className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600"
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-semibold text-slate-900 truncate">
                                                                    {property.title}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 truncate">
                                                                    {property.city}/{property.state}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="flex-1 flex flex-col">
                                        <label className="text-[10px] font-semibold text-slate-500 uppercase">
                                            {contentTab === 'message' ? 'Mensagem' : 'Mensagem base (opcional)'}
                                        </label>
                                        <textarea
                                            value={message}
                                            onChange={(event) => setMessage(event.target.value)}
                                            placeholder="Ola {{nome}}, temos novidades para voce!"
                                            className="mt-1 flex-1 min-h-[180px] w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {VARIABLE_TOKENS.map((token) => (
                                        <span
                                            key={token}
                                            className="px-2 py-1 rounded-full border border-slate-200 text-[10px] text-slate-500"
                                        >
                                            {token}
                                        </span>
                                    ))}
                                </div>

                            </div>


                            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-bold text-slate-900">Resumo do disparo</p>
                                    <span className="text-[10px] font-semibold text-slate-500">{contentLabel}</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="border border-slate-200 rounded-2xl p-3">
                                        <p className="text-[10px] text-slate-500">Contatos selecionados</p>
                                        <p className="text-2xl font-bold text-slate-900">{selectedIds.size}</p>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {selectedContacts.slice(0, 3).map((contact) => (
                                                <span
                                                    key={contact.id}
                                                    className="px-2 py-1 rounded-full bg-slate-100 text-[10px] text-slate-600"
                                                >
                                                    {contact.name.split(' ')[0]}
                                                </span>
                                            ))}
                                            {selectedContacts.length > 3 ? (
                                                <span className="px-2 py-1 rounded-full bg-slate-100 text-[10px] text-slate-500">
                                                    +{selectedContacts.length - 3} outros
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="border border-slate-200 rounded-2xl p-3">
                                        <p className="text-[10px] text-slate-500">Previa do conteudo</p>
                                        <p className="mt-2 text-xs text-slate-700 whitespace-pre-wrap">
                                            {previewMessage}
                                        </p>
                                    </div>
                                    {sendState === 'sending' ? (
                                        <div className="border border-amber-200 rounded-2xl p-3 bg-amber-50 text-[10px] text-amber-700">
                                            Enviando... {sendStats.sent}/{selectedIds.size} enviados
                                        </div>
                                    ) : null}
                                    {sendState === 'done' ? (
                                        <div className="border border-emerald-200 rounded-2xl p-3 bg-emerald-50 text-[10px] text-emerald-700">
                                            Envio concluido. {sendStats.sent} enviados, {sendStats.error} falhas.
                                        </div>
                                    ) : null}
                                    {sendState === 'error' ? (
                                        <div className="border border-rose-200 rounded-2xl p-3 bg-rose-50 text-[10px] text-rose-700">
                                            Falha ao enviar.
                                        </div>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={handleSend}
                                        className={`w-full py-2 rounded-xl text-xs font-semibold ${canSend
                                            ? 'bg-slate-900 text-white hover:bg-black'
                                            : 'bg-slate-100 text-slate-400'
                                            }`}
                                        disabled={!canSend}
                                    >
                                        {sendState === 'sending' ? 'Enviando...' : 'Disparar campanha'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveDraft}
                                        className="w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Salvar lista
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>


    );
}
