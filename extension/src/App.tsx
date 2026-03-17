import { useEffect, useRef, useState } from 'react';
import { CrmMasterPanel } from './components/crm/CrmMasterPanel';
import { MarketingPanel } from './components/marketing/MarketingPanel';
import { AgendaPanel } from './components/agenda/AgendaPanel';
import { PipelinePanel } from './components/pipeline/PipelinePanel';
import { AttendancePanel } from './components/attendance/AttendancePanel';
import { FunnelPanel } from './components/funnel/FunnelPanel';
import { WhatsAppScraper, type ChatIdentity } from './content/scraper';

type ActiveTab = 'crm' | 'broadcast' | 'agenda' | 'pipeline' | 'attendance' | 'funnel' | null;

type WppContactPayload = {
  id?: string;
  name?: string;
  phone?: string;
  isMyContact?: boolean;
  isBusiness?: boolean;
};

type AttendanceEventPayload = {
  chatId: string;
  messageId: string;
  direction: 'in' | 'out';
  timestamp: string;
  name?: string;
  phone?: string;
};

function sendRuntimeMessage<T>(message: any): Promise<T> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      resolve({} as T);
      return;
    }
    chrome.runtime.sendMessage(message, resolve);
  });
}

const normalizeNameKey = (value?: string) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const normalized = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]+/g, '');
  return compact || normalized;
};

const normalizePhoneDigits = (value?: string) => {
  if (!value) return '';
  return String(value).replace(/\D/g, '');
};

const extractChatIdDigits = (value?: string) => {
  if (!value) return '';
  const raw = value.includes('@') ? value.split('@')[0] : value;
  return normalizePhoneDigits(raw);
};

const findContactMatch = (
  contacts: WppContactPayload[],
  target: { chatId?: string; phone?: string; name?: string }
) => {
  if (!contacts.length) return null;
  const chatId = target.chatId || '';
  if (chatId) {
    const byId = contacts.find((contact) => contact?.id === chatId);
    if (byId) return byId;
  }

  const phoneDigits = normalizePhoneDigits(target.phone);
  if (phoneDigits) {
    const byPhone = contacts.find((contact) => normalizePhoneDigits(contact?.phone) === phoneDigits);
    if (byPhone) return byPhone;
  }

  const chatIdDigits = extractChatIdDigits(chatId);
  if (chatIdDigits) {
    const byChatDigits = contacts.find((contact) => normalizePhoneDigits(contact?.phone) === chatIdDigits);
    if (byChatDigits) return byChatDigits;
  }

  const nameKey = normalizeNameKey(target.name);
  if (nameKey) {
    const matches = contacts.filter((contact) => normalizeNameKey(contact?.name || '') === nameKey);
    if (matches.length === 1) return matches[0];
  }

  return null;
};

const isSameChat = (prev: ChatIdentity, next: ChatIdentity) => {
  if (prev.chatId && next.chatId && prev.chatId === next.chatId) return true;
  if (prev.phone && next.phone && prev.phone === next.phone) return true;
  const prevKey = normalizeNameKey(prev.name);
  const nextKey = normalizeNameKey(next.name);
  return !!prevKey && prevKey === nextKey;
};

const mergeChatIdentity = (prev: ChatIdentity | null, next: ChatIdentity | null) => {
  if (!next) return next;
  if (!prev) return next;
  if (!isSameChat(prev, next)) return next;

  return {
    ...next,
    chatId: next.chatId || prev.chatId,
    name: next.name || prev.name,
    phone: next.phone || prev.phone,
    avatarUrl: next.avatarUrl || prev.avatarUrl,
  };
};

const AUTO_SYNC_MAX_ATTEMPTS = 30;
const AUTO_SYNC_RETRY_DELAY_MS = 1000;
const AUTO_SYNC_START_DELAY_MS = 12000;
const AUTO_SYNC_MIN_INTERVAL_MS = 5 * 60 * 1000;
const AUTO_SYNC_IDLE_TIMEOUT_MS = 2000;
const CONTACTS_CACHE_TTL_MS = 5 * 60 * 1000;
const ACTIVE_CHAT_WPP_ATTEMPTS = 3;
const ACTIVE_CHAT_WPP_RETRY_DELAY_MS = 1200;
const ATTENDANCE_POLL_INTERVAL_MS = 20000;
const ATTENDANCE_CACHE_VERSION = 'v3';
const ATTENDANCE_CACHE_VERSION_KEY = 'crm_attendance_cache_version';

function App({ onWidthChange }: { onWidthChange?: (width: number) => void }) {
  const sidebarWidth = 64;
  const crmPanelWidth = 420;
  const [activeTab, setActiveTab] = useState<ActiveTab>('crm');
  const [activeChat, setActiveChat] = useState<ChatIdentity | null>(null);
  const autoSyncStartedRef = useRef(false);
  const contactsCacheRef = useRef<{ items: WppContactPayload[]; fetchedAt: number } | null>(null);
  const contactsRequestRef = useRef<Promise<WppContactPayload[]> | null>(null);
  const isInjected = !!document.getElementById('whatsapp-crm-extension-root');

  useEffect(() => {
    const panelWidth = activeTab ? crmPanelWidth : 0;
    const width = sidebarWidth + (activeTab ? panelWidth : 0);
    onWidthChange?.(width);
  }, [activeTab, crmPanelWidth, onWidthChange, sidebarWidth]);

  useEffect(() => {
    if (!isInjected) return;
    setActiveChat(WhatsAppScraper.getActiveChat());
    return WhatsAppScraper.observeChatChanges((chat) => {
      setActiveChat((prev) => mergeChatIdentity(prev, chat));
    });
  }, [isInjected]);

    useEffect(() => {
      if (!isInjected || !activeChat) return;
      if (activeChat.phone) return;
      let cancelled = false;

      const enrichActiveChat = async () => {
        const fetchWppWithRetry = async () => {
          for (let attempt = 0; attempt < ACTIVE_CHAT_WPP_ATTEMPTS; attempt += 1) {
            const wppChat = await WhatsAppScraper.fetchActiveChatWPP();
            if (wppChat) return wppChat;
            if (attempt < ACTIVE_CHAT_WPP_ATTEMPTS - 1) {
              await new Promise((resolve) => setTimeout(resolve, ACTIVE_CHAT_WPP_RETRY_DELAY_MS));
            }
          }
          return null;
        };

        const getCachedContacts = async () => {
          const now = Date.now();
          const cached = contactsCacheRef.current;
          if (cached && now - cached.fetchedAt < CONTACTS_CACHE_TTL_MS) {
            return cached.items;
          }
          if (!contactsRequestRef.current) {
            contactsRequestRef.current = WhatsAppScraper.getWppContacts();
          }
          const items = await contactsRequestRef.current;
          contactsRequestRef.current = null;
          contactsCacheRef.current = { items, fetchedAt: Date.now() };
          return items;
        };

        const wppChat = await fetchWppWithRetry();
        if (cancelled) return;

        let resolved: ChatIdentity = {
          name: wppChat?.name || activeChat.name || '',
          phone: wppChat?.phone || '',
          chatId: wppChat?.id || activeChat.chatId,
          avatarUrl: activeChat.avatarUrl
        };

        if (!resolved.phone) {
          const contacts = await getCachedContacts();
          if (cancelled) return;
          const match = findContactMatch(contacts, resolved);
          if (match?.phone) {
            resolved = {
              ...resolved,
              phone: match.phone || '',
              name: match.name || resolved.name,
              chatId: resolved.chatId || match.id
            };
            console.log('[CRM DEBUG] Active chat phone resolved from contacts', {
              chatId: resolved.chatId,
              phone: resolved.phone,
              name: resolved.name
            });
          } else {
            console.log('[CRM DEBUG] Active chat phone unresolved', {
              chatId: resolved.chatId,
              name: resolved.name
            });
          }
        } else {
          console.log('[CRM DEBUG] Active chat phone resolved via WPP', {
            chatId: resolved.chatId,
            phone: resolved.phone,
            name: resolved.name
          });
        }

        setActiveChat((prev) => mergeChatIdentity(prev, resolved));
      };

      enrichActiveChat();

    return () => {
      cancelled = true;
    };
  }, [isInjected, activeChat?.chatId, activeChat?.phone, activeChat?.name]);

  useEffect(() => {
    if (!isInjected || autoSyncStartedRef.current) return;
    autoSyncStartedRef.current = true;

    let cancelled = false;

    const runAutoSync = async () => {
      const globalWindow = window as any;
      const lastSync = Number(globalWindow.__IVILLAR_LAST_AUTO_SYNC__ || 0);
      if (lastSync && Date.now() - lastSync < AUTO_SYNC_MIN_INTERVAL_MS) {
        globalWindow.__IVILLAR_AUTO_SYNC_STATE__ = 'done';
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, AUTO_SYNC_START_DELAY_MS));
      if (cancelled) return;

      const currentState = globalWindow.__IVILLAR_AUTO_SYNC_STATE__;
      if (currentState === 'running' || currentState === 'done') {
        return;
      }
      globalWindow.__IVILLAR_AUTO_SYNC_STATE__ = 'running';

      if (typeof (window as any).requestIdleCallback === 'function') {
        await new Promise((resolve) =>
          (window as any).requestIdleCallback(resolve, { timeout: AUTO_SYNC_IDLE_TIMEOUT_MS })
        );
      }

      for (let attempt = 0; attempt < AUTO_SYNC_MAX_ATTEMPTS && !cancelled; attempt += 1) {
        const ownerId = await WhatsAppScraper.getMe();
        if (!ownerId) {
          await new Promise((resolve) => setTimeout(resolve, AUTO_SYNC_RETRY_DELAY_MS));
          continue;
        }

        let syncedCount = 0;
        await WhatsAppScraper.syncAddressBook((count) => {
          syncedCount = count;
        }, { mode: 'cache' });
        console.log('[CRM] Auto-sync done:', syncedCount);
        if (syncedCount > 0) {
          globalWindow.__IVILLAR_LAST_AUTO_SYNC__ = Date.now();
          globalWindow.__IVILLAR_AUTO_SYNC_STATE__ = 'done';
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, AUTO_SYNC_RETRY_DELAY_MS));
      }

      if (!cancelled) {
        globalWindow.__IVILLAR_AUTO_SYNC_STATE__ = 'error';
      }
    };

    runAutoSync();

    return () => {
      cancelled = true;
    };
  }, [isInjected]);

  useEffect(() => {
    if (!isInjected) return;
    let cancelled = false;
    let pollTimer: number | null = null;
    let cachedOwner: string | null = null;
    let cachedMap: Record<string, string> = {};
    let cacheResetDone = false;

    const storageKeyFor = (ownerId: string) => `crm_attendance_last_${ownerId}`;

    const loadState = async (ownerId: string) => {
      if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
      const key = storageKeyFor(ownerId);
      const stored = await chrome.storage.local.get(key);
      cachedMap = (stored?.[key] as Record<string, string>) || {};
    };

    const resetCacheIfNeeded = async () => {
      if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
      const stored = await chrome.storage.local.get(ATTENDANCE_CACHE_VERSION_KEY);
      const current = stored?.[ATTENDANCE_CACHE_VERSION_KEY];
      if (current === ATTENDANCE_CACHE_VERSION) return;
      const all = await chrome.storage.local.get(null);
      const keysToRemove = Object.keys(all).filter((key) => key.startsWith('crm_attendance_last_'));
      if (keysToRemove.length) {
        await chrome.storage.local.remove(keysToRemove);
      }
      await chrome.storage.local.set({ [ATTENDANCE_CACHE_VERSION_KEY]: ATTENDANCE_CACHE_VERSION });
      cachedOwner = null;
      cachedMap = {};
    };

    const saveState = async (ownerId: string) => {
      if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
      const key = storageKeyFor(ownerId);
      await chrome.storage.local.set({ [key]: cachedMap });
    };

    const parseTimestamp = (value: any) => {
      if (!value) return null;
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        const ms = numeric < 1e12 ? numeric * 1000 : numeric;
        return new Date(ms).toISOString();
      }
      try {
        const date = new Date(String(value));
        if (!Number.isNaN(date.getTime())) return date.toISOString();
      } catch {
        // ignore
      }
      return null;
    };

    const pollAttendance = async () => {
      if (cancelled) return;
      if (!cacheResetDone) {
        await resetCacheIfNeeded();
        cacheResetDone = true;
      }
      const ownerId = await WhatsAppScraper.getMe();
      if (!ownerId) {
        pollTimer = window.setTimeout(pollAttendance, ATTENDANCE_POLL_INTERVAL_MS);
        return;
      }
      if (cachedOwner !== ownerId) {
        cachedOwner = ownerId;
        await loadState(ownerId);
      }

      const chats = await WhatsAppScraper.getWppChats();
      if (!Array.isArray(chats) || !chats.length) {
        pollTimer = window.setTimeout(pollAttendance, ATTENDANCE_POLL_INTERVAL_MS);
        return;
      }

      const events: AttendanceEventPayload[] = [];
      chats.forEach((chat: any) => {
        if (!chat || !chat.id) return;
        if (chat.isGroup || chat.isNewsletter || chat.isBroadcast) return;
        if (String(chat.id).includes('@g.us')) return;
        if (String(chat.id).includes('status@broadcast')) return;

        const rawTimestamp =
          chat.lastMessageTimestamp ??
          chat.lastMessageTime ??
          chat.lastMessageTimestampMs ??
          chat.t ??
          chat.lastMessage?.timestamp ??
          chat.lastMessage?.t ??
          null;
        const lastMessageTimestamp = parseTimestamp(rawTimestamp);
        if (!lastMessageTimestamp) return;

        let lastMessageId = String(chat.lastMessageId || '');
        if (!lastMessageId) {
          lastMessageId = `${chat.id}_${lastMessageTimestamp}`;
        }
        if (!lastMessageId) return;

        let fromMe = chat.lastMessageFromMe;
        if (typeof fromMe !== 'boolean') {
          if (typeof chat.lastMessage?.fromMe === 'boolean') {
            fromMe = chat.lastMessage.fromMe;
          } else if (typeof chat.lastMessage?.isSentByMe === 'boolean') {
            fromMe = chat.lastMessage.isSentByMe;
          } else if (typeof chat.lastMessage?.id?.fromMe === 'boolean') {
            fromMe = chat.lastMessage.id.fromMe;
          }
        }
        if (typeof fromMe !== 'boolean' && chat.lastMessageAuthor) {
          const ownerDigits = normalizePhoneDigits(cachedOwner || '');
          const authorDigits = normalizePhoneDigits(chat.lastMessageAuthor);
          if (ownerDigits && authorDigits) {
            fromMe = authorDigits === ownerDigits;
          }
        }

        const directionKey = fromMe === true ? 'out' : fromMe === false ? 'in' : 'unknown';
        if (directionKey === 'unknown') return;

        const messageKey = `${lastMessageId}_${directionKey}`;
        const previous = cachedMap[chat.id];
        if (previous === messageKey) return;
        cachedMap[chat.id] = messageKey;

        const direction: 'in' | 'out' = fromMe === true ? 'out' : 'in';
        const messageId = lastMessageId;

        events.push({
          chatId: chat.id,
          messageId,
          direction,
          timestamp: lastMessageTimestamp,
          name: chat.name || 'Sem Nome',
          phone: chat.phone || '',
        });
      });

      if (events.length) {
        const response = await sendRuntimeMessage<{ count?: number; error?: string }>({
          type: 'SAVE_ATTENDANCE_EVENTS',
          ownerId: cachedOwner,
          events,
        });
        if (response?.error) {
          console.warn('[CRM ATTENDANCE] Save failed', response.error);
        } else {
          console.log('[CRM ATTENDANCE] Events saved', {
            ownerId: cachedOwner,
            count: response?.count ?? events.length,
          });
        }
        await saveState(cachedOwner);
      }

      pollTimer = window.setTimeout(pollAttendance, ATTENDANCE_POLL_INTERVAL_MS);
    };

    pollAttendance();

    return () => {
      cancelled = true;
      if (pollTimer) window.clearTimeout(pollTimer);
    };
  }, [isInjected]);

  if (!isInjected) {
    return (
      <div className="min-w-[200px] bg-[var(--panel-bg)] text-slate-900 p-4">
        <p className="text-xs text-slate-500">Abra o WhatsApp Web para ver o painel.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-[var(--panel-bg)] pointer-events-none">
      <div className="w-[64px] h-full flex flex-col items-center bg-gradient-to-b from-slate-100 via-slate-50 to-white border-r border-slate-200/80 shadow-[inset_-1px_0_0_rgba(255,255,255,0.7)] z-20 py-5 gap-3 box-border pointer-events-auto">
        <div className="mb-2">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-brand-700 shadow-sm font-bold text-base">
            IV
          </div>
        </div>
        <button
          onClick={() => setActiveTab((current) => (current === 'crm' ? null : 'crm'))}
          className={`w-10 h-10 rounded-2xl border text-[10px] font-bold uppercase tracking-wide transition ${
            activeTab === 'crm'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-slate-200 text-slate-900 border-slate-300 hover:bg-slate-300'
          }`}
        >
          CRM
        </button>
        <button
          onClick={() => setActiveTab((current) => (current === 'agenda' ? null : 'agenda'))}
          className={`w-10 h-10 rounded-2xl border transition ${
            activeTab === 'agenda'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-slate-200 text-slate-900 border-slate-300 hover:bg-slate-300'
          }`}
          title="Agenda"
          aria-label="Agenda"
        >
          <span className="flex flex-col items-center justify-center gap-0.5 leading-none">
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wide">AG</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab((current) => (current === 'pipeline' ? null : 'pipeline'))}
          className={`w-10 h-10 rounded-2xl border transition ${
            activeTab === 'pipeline'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-slate-200 text-slate-900 border-slate-300 hover:bg-slate-300'
          }`}
          title="Pipeline"
          aria-label="Pipeline"
        >
          <span className="flex flex-col items-center justify-center gap-0.5 leading-none">
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="6" height="16" rx="1" />
              <rect x="10.5" y="4" width="6" height="16" rx="1" />
              <rect x="18" y="4" width="3" height="16" rx="1" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wide">PL</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab((current) => (current === 'funnel' ? null : 'funnel'))}
          className={`w-10 h-10 rounded-2xl border transition ${
            activeTab === 'funnel'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-slate-200 text-slate-900 border-slate-300 hover:bg-slate-300'
          }`}
          title="Funil"
          aria-label="Funil"
        >
          <span className="flex flex-col items-center justify-center gap-0.5 leading-none">
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wide">FU</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab((current) => (current === 'attendance' ? null : 'attendance'))}
          className={`w-10 h-10 rounded-2xl border transition ${
            activeTab === 'attendance'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-slate-200 text-slate-900 border-slate-300 hover:bg-slate-300'
          }`}
          title="Painel de Atendimento"
          aria-label="Painel de Atendimento"
        >
          <span className="flex flex-col items-center justify-center gap-0.5 leading-none">
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 4h16v12H5.5L4 18V4z" />
              <path d="M8 8h8" />
              <path d="M8 12h5" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wide">PA</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab((current) => (current === 'broadcast' ? null : 'broadcast'))}
          className={`w-10 h-10 rounded-2xl border transition ${
            activeTab === 'broadcast'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-slate-200 text-slate-900 border-slate-300 hover:bg-slate-300'
          }`}
          title="Envio em massa"
          aria-label="Envio em massa"
        >
          <span className="flex flex-col items-center justify-center gap-0.5 leading-none">
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wide">EM</span>
          </span>
        </button>
      </div>

      {activeTab === 'crm' ? (
        <div
          style={{ width: crmPanelWidth }}
          className="h-full bg-white border-r border-slate-200/80 shadow-[inset_-1px_0_0_rgba(255,255,255,0.7)] pointer-events-auto"
        >
          <CrmMasterPanel activeChat={activeChat} />
        </div>
      ) : null}

      {activeTab === 'agenda' ? (
        <div
          style={{ width: crmPanelWidth }}
          className="h-full bg-white border-r border-slate-200/80 shadow-[inset_-1px_0_0_rgba(255,255,255,0.7)] pointer-events-auto"
        >
          <AgendaPanel />
        </div>
      ) : null}

      {activeTab === 'pipeline' ? (
        <div
          style={{ width: crmPanelWidth }}
          className="h-full bg-white border-r border-slate-200/80 shadow-[inset_-1px_0_0_rgba(255,255,255,0.7)] pointer-events-auto"
        >
          <PipelinePanel />
        </div>
      ) : null}

      {activeTab === 'attendance' ? (
        <div
          style={{ width: crmPanelWidth }}
          className="h-full bg-white border-r border-slate-200/80 shadow-[inset_-1px_0_0_rgba(255,255,255,0.7)] pointer-events-auto"
        >
          <AttendancePanel />
        </div>
      ) : null}

      {activeTab === 'broadcast' ? (
        <MarketingPanel onClose={() => setActiveTab(null)} />
      ) : null}

      {activeTab === 'funnel' ? (
        <FunnelPanel onClose={() => setActiveTab(null)} />
      ) : null}
    </div>
  );
}

export default App;
