import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { Server } from 'socket.io';
import P from 'pino';

// ──────────────────────────────────────────────────────────────────────────────
// Tipos internos de chat / mensagem
// ──────────────────────────────────────────────────────────────────────────────
export interface WAMessage {
    id: string;
    body: string;
    fromMe: boolean;
    timestamp: number;
    type: 'chat';
}

export interface WAChat {
    id: string;
    name: string;
    phoneNumber: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    messages: WAMessage[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Estado global do serviço
// ──────────────────────────────────────────────────────────────────────────────
type WAStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'authenticated' | 'ready';

interface WhatsAppState {
    socket: WASocket | null;
    io: Server | null;
    status: WAStatus;
    lastQR: string | null;
    reconnectTimer: NodeJS.Timeout | null;
    authDir: string;
    chats: Map<string, WAChat>;
    contacts: Map<string, string>;    // jid → nome do contato
    saveTimer: NodeJS.Timeout | null; // debounce para salvar no disco
}

const STORE_FILE = process.env.WA_STORE_PATH || path.join(process.cwd(), '.wa_store.json');
const AUTH_DIR   = process.env.WA_AUTH_PATH   || path.join(process.cwd(), '.wa_auth');
const logger     = P({ level: 'silent' });

const state: WhatsAppState = {
    socket: null,
    io: null,
    status: 'disconnected',
    lastQR: null,
    reconnectTimer: null,
    authDir: AUTH_DIR,
    chats: new Map(),
    contacts: new Map(),
    saveTimer: null,
};

// ──────────────────────────────────────────────────────────────────────────────
// Persistência em arquivo JSON
// ──────────────────────────────────────────────────────────────────────────────
function loadStore() {
    try {
        if (!fs.existsSync(STORE_FILE)) return;
        const raw = fs.readFileSync(STORE_FILE, 'utf8');
        const data = JSON.parse(raw);
        state.chats    = new Map((data.chats    || []) as [string, WAChat][]);
        state.contacts = new Map((data.contacts || []) as [string, string][]);
        console.log(`[WhatsApp] Store carregado: ${state.chats.size} chats, ${state.contacts.size} contatos`);
    } catch (e) {
        console.error('[WhatsApp] Erro ao carregar store:', e);
    }
}

function saveStore() {
    if (state.saveTimer) clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(() => {
        try {
            const data = {
                chats:    Array.from(state.chats.entries()),
                contacts: Array.from(state.contacts.entries()),
            };
            fs.writeFileSync(STORE_FILE, JSON.stringify(data));
        } catch (e) {
            console.error('[WhatsApp] Erro ao salvar store:', e);
        }
    }, 2_000); // debounce de 2s para não bater disco em loop
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
function emit(event: string, data?: any) {
    if (state.io) state.io.emit(event, data);
}

function emitToAdmins(event: string, data?: any) {
    if (state.io) state.io.to('role_admin').to('role_super_admin').emit(event, data);
}

function setStatus(s: WAStatus) {
    state.status = s;
    emit('whatsapp_status', s);
    console.log(`[WhatsApp] Status: ${s}`);
}

let reconnectAttempts = 0;

function scheduleReconnect() {
    const delayMs = Math.min(30_000, 2_000 * Math.pow(2, reconnectAttempts));
    reconnectAttempts++;
    if (state.reconnectTimer) clearTimeout(state.reconnectTimer);
    state.reconnectTimer = setTimeout(() => {
        console.log(`[WhatsApp] Tentando reconexão... (tentativa ${reconnectAttempts}, delay ${delayMs}ms)`);
        connect();
    }, delayMs);
}

function isFilteredJid(jid: string): boolean {
    if (!jid) return true;
    if (jid === 'status@broadcast')    return true;
    if (jid.endsWith('@newsletter'))   return true;
    if (jid.endsWith('@broadcast'))    return true;
    if (jid.endsWith('@lid'))          return true;
    return false;
}

function resolveContactName(jid: string, pushName?: string): string {
    // Prioridade: contato salvo > pushName do Baileys > número formatado
    const saved = state.contacts.get(jid);
    if (saved) return saved;
    if (pushName) return pushName;
    const phone = jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    if (phone.startsWith('55') && phone.length >= 12) {
        const ddd = phone.slice(2, 4);
        const num = phone.slice(4);
        return `(${ddd}) ${num.length > 8 ? num.slice(0, 5) + '-' + num.slice(5) : num.slice(0, 4) + '-' + num.slice(4)}`;
    }
    return phone;
}

// ──────────────────────────────────────────────────────────────────────────────
// connect — cria socket Baileys e registra todos os eventos
// ──────────────────────────────────────────────────────────────────────────────
async function connect() {
    if (!fs.existsSync(state.authDir)) {
        fs.mkdirSync(state.authDir, { recursive: true });
    }

    setStatus('connecting');

    const { state: authState, saveCreds } = await useMultiFileAuthState(state.authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: {
            creds: authState.creds,
            keys: makeCacheableSignalKeyStore(authState.keys, logger),
        },
        browser: ['Ivillar CRM', 'Chrome', '120.0'],
        connectTimeoutMs: 30_000,
        retryRequestDelayMs: 2_000,
        maxMsgRetryCount: 3,
        qrTimeout: 60_000,
        syncFullHistory: true,    // necessário para trazer lista completa de contatos
    });

    state.socket = sock;

    // ── QR Code ────────────────────────────────────────────────────────────────
    sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            try {
                const dataUrl = await qrcode.toDataURL(qr, { margin: 2, width: 300 });
                state.lastQR = dataUrl;
                setStatus('qr_ready');
                emitToAdmins('whatsapp_qr', dataUrl);
                console.log('[WhatsApp] QR code gerado e emitido');
            } catch (err) {
                console.error('[WhatsApp] Erro ao gerar QR:', err);
            }
        }

        if (connection === 'open') {
            state.lastQR = null;
            reconnectAttempts = 0;
            if (state.reconnectTimer) clearTimeout(state.reconnectTimer);
            setStatus('ready');
            emit('whatsapp_ready');
            console.log('[WhatsApp] Conectado ao WhatsApp ✓');
        }

        if (connection === 'close') {
            const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const loggedOut = reason === DisconnectReason.loggedOut;

            console.log(`[WhatsApp] Conexão fechada. Razão: ${reason}`);
            setStatus('disconnected');
            emit('whatsapp_disconnected', { reason });

            if (loggedOut) {
                console.log('[WhatsApp] Sessão encerrada. Limpando credenciais...');
                clearAuthDir();
                reconnectAttempts = 0;
            }
            scheduleReconnect();
        }

        if ((update as any).isNewLogin) {
            setStatus('authenticated');
            emit('whatsapp_authenticated');
        }
    });

    // ── Salva credenciais ──────────────────────────────────────────────────────
    sock.ev.on('creds.update', saveCreds);

    // Utilitário para processar lista de contatos (usado em múltiplos eventos)
    function syncContacts(contacts: any[]) {
        let count = 0;
        for (const c of contacts) {
            const jid  = c.id || '';
            const name = c.name || c.notify || '';
            if (jid && name) {
                state.contacts.set(jid, name);
                const chat = state.chats.get(jid);
                if (chat && chat.name !== name) chat.name = name;
                count++;
            }
        }
        return count;
    }

    // Utilitário para processar lista de chats (usado em múltiplos eventos)
    function syncChats(chats: any[]) {
        let count = 0;
        for (const c of chats) {
            const jid = c.id || '';
            if (isFilteredJid(jid)) continue;
            if (state.chats.has(jid)) continue;

            const phone = jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
            const name  = resolveContactName(jid);
            const ts    = c.conversationTimestamp || Math.floor(Date.now() / 1000);

            state.chats.set(jid, {
                id: jid,
                name,
                phoneNumber: phone,
                lastMessage: '',
                lastMessageTime: new Date(ts * 1000).toISOString(),
                unreadCount: c.unreadCount || 0,
                messages: [],
            });
            count++;
        }
        return count;
    }

    // ── 1ª conexão (após scan do QR): messaging-history.set ───────────────────
    (sock.ev as any).on('messaging-history.set', (data: any) => {
        const { contacts, chats, isLatest, syncType } = data || {};
        console.log(`[WhatsApp] messaging-history.set: syncType=${syncType} isLatest=${isLatest} contacts=${Array.isArray(contacts) ? contacts.length : '?'} chats=${Array.isArray(chats) ? chats.length : '?'}`);
        const cc = Array.isArray(contacts) ? syncContacts(contacts) : 0;
        const ch = Array.isArray(chats)    ? syncChats(chats)       : 0;
        console.log(`[WhatsApp] histórico processado: ${cc} contatos novos, ${ch} chats novos`);
        saveStore();
        emit('whatsapp_chats_updated');
    });

    // ── Reconexões: contacts.upsert + chats.upsert ────────────────────────────
    (sock.ev as any).on('contacts.upsert', (contacts: any[]) => {
        console.log(`[WhatsApp] contacts.upsert: ${Array.isArray(contacts) ? contacts.length : 0} itens`);
        const cc = Array.isArray(contacts) ? syncContacts(contacts) : 0;
        if (cc > 0) {
            saveStore();
            emit('whatsapp_contacts_updated');
        }
    });

    (sock.ev as any).on('chats.upsert', (chats: any[]) => {
        console.log(`[WhatsApp] chats.upsert: ${Array.isArray(chats) ? chats.length : 0} itens`);
        const ch = Array.isArray(chats) ? syncChats(chats) : 0;
        if (ch > 0) {
            saveStore();
            emit('whatsapp_chats_updated');
        }
    });

    // ── Atualizações em tempo real ─────────────────────────────────────────────
    (sock.ev as any).on('contacts.update', (updates: any[]) => {
        for (const u of updates) {
            const jid  = u.id || '';
            const name = u.notify || u.name || '';
            if (jid && name) {
                state.contacts.set(jid, name);
                const chat = state.chats.get(jid);
                if (chat) chat.name = name;
            }
        }
        saveStore();
    });

    (sock.ev as any).on('chats.update', (updates: any[]) => {
        for (const u of updates) {
            const jid = u.id || '';
            if (isFilteredJid(jid)) continue;
            const chat = state.chats.get(jid);
            if (chat && u.unreadCount !== undefined) {
                chat.unreadCount = u.unreadCount || 0;
            }
        }
    });

    // ── Armazena mensagens recebidas/enviadas ──────────────────────────────────
    sock.ev.on('messages.upsert', ({ messages, type }: { messages: any[], type: string }) => {
        if (type !== 'notify' && type !== 'append') return;

        for (const msg of messages) {
            if (!msg.message) continue;

            const jid = msg.key.remoteJid || '';
            if (isFilteredJid(jid)) continue;

            const body =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                msg.message.imageMessage?.caption ||
                msg.message.videoMessage?.caption ||
                '[mídia]';

            const waMsg: WAMessage = {
                id: msg.key.id || `${Date.now()}`,
                body,
                fromMe: msg.key.fromMe ?? false,
                timestamp: (msg.messageTimestamp as number) || Math.floor(Date.now() / 1000),
                type: 'chat',
            };

            const phone    = jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
            const pushName = (msg as any).pushName as string | undefined;
            const existing = state.chats.get(jid);

            if (existing) {
                if (!existing.messages.find(m => m.id === waMsg.id)) {
                    existing.messages.push(waMsg);
                    existing.lastMessage = body;
                    existing.lastMessageTime = new Date(waMsg.timestamp * 1000).toISOString();
                    if (!waMsg.fromMe) existing.unreadCount += 1;
                    // Atualiza nome se ainda não tem
                    if (pushName && !state.contacts.has(jid)) {
                        existing.name = pushName;
                    }
                }
            } else {
                const name = resolveContactName(jid, pushName);
                state.chats.set(jid, {
                    id: jid,
                    name,
                    phoneNumber: phone,
                    lastMessage: body,
                    lastMessageTime: new Date(waMsg.timestamp * 1000).toISOString(),
                    unreadCount: waMsg.fromMe ? 0 : 1,
                    messages: [waMsg],
                });
            }

            if (!msg.key.fromMe) {
                emit('whatsapp_message', { jid, message: waMsg });
            }
        }

        saveStore();
    });
}

// ──────────────────────────────────────────────────────────────────────────────
// Limpa diretório de autenticação
// ──────────────────────────────────────────────────────────────────────────────
function clearAuthDir() {
    try {
        if (fs.existsSync(state.authDir)) {
            fs.rmSync(state.authDir, { recursive: true, force: true });
            fs.mkdirSync(state.authDir, { recursive: true });
        }
    } catch (e) {
        console.error('[WhatsApp] Erro ao limpar credenciais:', e);
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Envio de mensagem de texto
// ──────────────────────────────────────────────────────────────────────────────
async function sendTextMessage(phone: string, text: string): Promise<boolean> {
    if (!state.socket || state.status !== 'ready') {
        console.warn('[WhatsApp] Não conectado. Mensagem não enviada.');
        return false;
    }
    try {
        const jid  = phone.replace(/\D/g, '') + '@s.whatsapp.net';
        const sent = await state.socket.sendMessage(jid, { text });
        console.log(`[WhatsApp] Mensagem enviada para ${jid}`);

        const waMsg: WAMessage = {
            id: sent?.key?.id || `${Date.now()}`,
            body: text,
            fromMe: true,
            timestamp: Math.floor(Date.now() / 1000),
            type: 'chat',
        };

        const existing = state.chats.get(jid);
        if (existing) {
            existing.messages.push(waMsg);
            existing.lastMessage = text;
            existing.lastMessageTime = new Date().toISOString();
        } else {
            const phoneClean = phone.replace(/\D/g, '');
            state.chats.set(jid, {
                id: jid,
                name: resolveContactName(jid),
                phoneNumber: phoneClean,
                lastMessage: text,
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0,
                messages: [waMsg],
            });
        }

        saveStore();
        return true;
    } catch (err) {
        console.error('[WhatsApp] Erro ao enviar mensagem:', err);
        return false;
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Acesso ao store de chats
// ──────────────────────────────────────────────────────────────────────────────
function getChats(): WAChat[] {
    return Array.from(state.chats.values())
        .sort((a, b) => b.lastMessageTime.localeCompare(a.lastMessageTime));
}

function getChatMessages(jid: string): WAMessage[] {
    return state.chats.get(jid)?.messages ?? [];
}

function markAsRead(jid: string) {
    const chat = state.chats.get(jid);
    if (chat) { chat.unreadCount = 0; saveStore(); }
}

// ──────────────────────────────────────────────────────────────────────────────
// Desconexão manual (logout)
// ──────────────────────────────────────────────────────────────────────────────
async function logout() {
    if (state.reconnectTimer) clearTimeout(state.reconnectTimer);
    try { if (state.socket) await state.socket.logout(); } catch (_) {}
    state.socket = null;
    state.chats.clear();
    state.contacts.clear();
    clearAuthDir();
    try { if (fs.existsSync(STORE_FILE)) fs.unlinkSync(STORE_FILE); } catch (_) {}
    setStatus('disconnected');
}

// ──────────────────────────────────────────────────────────────────────────────
// Export público
// ──────────────────────────────────────────────────────────────────────────────
export const whatsappService = {
    init(io: Server) {
        state.io = io;
        loadStore(); // carrega dados persistidos
        console.log('[WhatsApp] Serviço iniciando...');

        io.on('connection', (socket) => {
            const user = (socket as any).user;
            const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

            socket.emit('whatsapp_status', state.status);
            if (isAdmin && state.lastQR) socket.emit('whatsapp_qr', state.lastQR);

            socket.on('whatsapp_reconnect', () => {
                if (!isAdmin) return;
                console.log('[WhatsApp] Reconexão solicitada via socket');
                connect();
            });
            socket.on('whatsapp_logout', async () => {
                if (!isAdmin) return;
                console.log('[WhatsApp] Logout solicitado via socket');
                await logout();
            });
        });

        connect().catch(err =>
            console.error('[WhatsApp] Erro ao iniciar conexão:', err)
        );
    },

    getStatus() { return state.status; },
    getChats,
    getChatMessages,
    markAsRead,
    sendTextMessage,
    logout,
    attachSocketID(_userId: string, _socketId: string) {},
};

export default whatsappService;
