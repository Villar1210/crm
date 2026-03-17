export type ChatIdentity = {
    name: string;
    phone: string;
    avatarUrl?: string;
    isBusiness?: boolean;
    chatId?: string; // serialized id if available
};

export type ChatMessage = {
    id: string;
    direction: 'in' | 'out';
    text: string;
    timestamp?: string;
};

// DEBUG LOGGER
const DEBUG = true;
const logDebug = (...args: any[]) => {
    if (DEBUG) console.log('[CRM DEBUG]', ...args);
};
const logBroadcast = (...args: any[]) => {
    if (DEBUG) console.log('[CRM BROADCAST]', ...args);
};

// HELPER FOR BACKGROUND COMMUNICATION
function sendRuntimeMessage<T>(message: any): Promise<T> {
    return new Promise((resolve, reject) => {
        try {
            if (typeof chrome === 'undefined' || !chrome.runtime) {
                // In development/mock environment, fail gracefully
                reject(new Error('Chrome runtime not available'));
                return;
            }
            logDebug('Sending runtime message:', message.type);
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('[CRM DEBUG] Runtime error:', chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        } catch (error) {
            console.error('[CRM DEBUG] Send message error:', error);
            reject(error);
        }
    });
}



// --- HELPER FUNCTIONS (Hoisted) ---

const extractPhoneFromText = (value?: string | null) => {
    if (!value) return '';
    const match = value.match(/\+?\d[\d\s().-]{8,}\d/);
    if (!match) {
        return '';
    }
    const digits = match[0].replace(/\D/g, '');
    return digits.length >= 10 ? digits : '';
};

const getTextFromElement = (node: Element) => {
    const text = node.textContent || '';
    const title = node.getAttribute('title') || '';
    const aria = node.getAttribute('aria-label') || '';
    return `${text} ${title} ${aria}`.trim();
};

const INFO_PANEL_TITLES = ['Dados do contato', 'Dados do perfil', 'Contact info', 'Contact profile'];

const normalizeNameKey = (value?: string) => {
    if (!value) return '';
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const INVALID_NAME_KEYS = new Set(INFO_PANEL_TITLES.map((title) => normalizeNameKey(title)));

const isInvalidName = (value?: string | null) => {
    const key = normalizeNameKey(value || '');
    return key ? INVALID_NAME_KEYS.has(key) : true;
};

const findInfoPanelTitle = () => {
    const nodes = Array.from(document.querySelectorAll('span, div, h1, h2, h3'));
    return (
        nodes.find((node) => {
            const text = (node.textContent || '').trim();
            return text && INFO_PANEL_TITLES.includes(text);
        }) || null
    );
};

const findPhoneInContainer = (container: Element | null) => {
    if (!container) return '';
    let best = '';
    const containerText = getTextFromElement(container);

    const direct = extractPhoneFromText(containerText);
    if (direct) {
        logDebug('-> Found phone in container text:', direct);
        best = direct;
    }

    const nodes = Array.from(container.querySelectorAll('span, div, a, button'));
    for (const node of nodes) {
        if (node.children.length === 0 && /\d/.test(node.textContent || '')) {
            const value = extractPhoneFromText(getTextFromElement(node));
            if (value && value.length > best.length) {
                best = value;
                logDebug('-> Found better phone in child node:', value);
            }
        }
    }
    return best;
};

const findInfoPanel = () => {
    const direct =
        document.querySelector('[data-testid="drawer-right"]') ||
        document.querySelector('[data-testid="chat-info-panel"]') ||
        document.querySelector('[aria-label*="Dados do contato"]') ||
        document.querySelector('[aria-label*="Contact info"]');
    if (direct) return direct as Element;

    const titleNode = findInfoPanelTitle();
    if (!titleNode) return null;

    const candidates: Element[] = [];
    const addCandidate = (node: Element | null) => {
        if (node && !candidates.includes(node)) {
            candidates.push(node);
        }
    };

    addCandidate(titleNode.closest('[role="dialog"]'));
    addCandidate(titleNode.closest('section'));
    addCandidate(titleNode.closest('aside'));
    addCandidate(titleNode.closest('div'));

    let current: Element | null = titleNode;
    for (let i = 0; i < 6 && current; i += 1) {
        addCandidate(current);
        current = current.parentElement;
    }

    return candidates.find((candidate) => findPhoneInContainer(candidate)) || candidates[0] || null;
};

// --- END HELPERS ---

// AUTOMATION STATE FOR PHONE CAPTURE
let isFetchingPhone = false;
const lastAttemptByChatKey = new Map<string, number>();
const COOLDOWN_MS = 30 * 1000;
let syncDebounceTimer: any = null;
let currentRunId = 0;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const simulateClick = (element: HTMLElement) => {
    logBroadcast('simulateClick: attempting click on', element.tagName, element.className);
    const opts = { bubbles: true, cancelable: true, view: window, composed: true, buttons: 1 };

    // Standard sequence
    element.dispatchEvent(new MouseEvent('mousedown', opts));
    element.dispatchEvent(new MouseEvent('mouseup', opts));
    element.dispatchEvent(new MouseEvent('click', opts));

    // React 17/18 compatibility: sometimes the event needs to be native
    // or sometimes we need to click the child
    if (element.children.length > 0) {
        logBroadcast('simulateClick: also clicking first child just in case');
        const child = element.firstElementChild as HTMLElement;
        if (child) {
            child.dispatchEvent(new MouseEvent('mousedown', opts));
            child.dispatchEvent(new MouseEvent('mouseup', opts));
            child.dispatchEvent(new MouseEvent('click', opts));
        }
    }
};

// function openDrawerByClickingHeader removed (legacy)

// function waitForDrawer removed (legacy)

// function closeDrawer removed (legacy)

const extractPhoneFromDrawer = (drawer: Element) => {
    if (!drawer) return '';

    logDebug('Drawer Found. Scanning...');

    const directExtract = findPhoneInContainer(drawer);
    if (directExtract) return directExtract;

    const regexList = [
        /\b55\d{10,12}\b/,
        /\+?\d{10,15}/,
    ];

    const candidates = Array.from(drawer.querySelectorAll('*'));
    for (const node of candidates) {
        if (node.children.length > 1) continue;

        const text = (node.textContent || '').trim();
        const clean = text.replace(/\D/g, '');

        if (clean.length < 10 || clean.length > 15) continue;

        for (const rx of regexList) {
            if (rx.test(text) || rx.test(clean)) {
                if (clean.startsWith('55') && clean.length >= 12) {
                    return clean;
                }
                const v = extractPhoneFromText(text);
                if (v) return v;
            }
        }
    }

    return '';
};

// Main Safe Sync Routine
async function syncContact(chatKey: string, currentIdentity: ChatIdentity, onUpdate: (chat: ChatIdentity | null) => void) {
    logDebug('syncContact triggered for:', chatKey);

    if (isFetchingPhone) return;
    if (currentIdentity.phone) return;

    const lastAttempt = lastAttemptByChatKey.get(chatKey) || 0;
    if (Date.now() - lastAttempt < COOLDOWN_MS) {
        // logDebug(`-> SKIPPED: Cooldown.`);
        return;
    }

    const myRunId = ++currentRunId;
    await wait(300);
    if (myRunId !== currentRunId) return;

    isFetchingPhone = true;
    document.body.classList.add('crm-fetching-phone');

    try {
        const cached = getCachedIdentity(currentIdentity.chatId || '', '');
        if (cached?.phone) {
            onUpdate(cached);
            return;
        }

        // 1. Try Backend (If already saved)
        try {
            const response = await sendRuntimeMessage<{ lead?: any }>({
                type: 'FETCH_LEAD',
                name: currentIdentity.name,
            });
            if (response?.lead?.phone) {
                logDebug('-> Found in backend:', response.lead.phone);
                cacheIdentity({ ...currentIdentity, phone: response.lead.phone });
                onUpdate({ ...currentIdentity, phone: response.lead.phone });
                return;
            }
        } catch (e) { /* ignore */ }

        // 2. Try WPPConnect (Stealth Mode)
        try {
            const wppChat = await WhatsAppScraper.fetchActiveChatWPP();
            if (wppChat && wppChat.phone) {
                console.log('[CRM] Captured via WPP (Stealth):', wppChat.phone);
                // Validate if it matches current chat (name check)
                const isMatch = !currentIdentity.name ||
                    (wppChat.name && normalizeNameKey(wppChat.name).includes(normalizeNameKey(currentIdentity.name))) ||
                    (currentIdentity.name && normalizeNameKey(currentIdentity.name).includes(normalizeNameKey(wppChat.name || '')));

                logDebug('WPP Name Match:', isMatch ? 'YES' : 'NO', wppChat.name, currentIdentity.name);

                // Trust WPP active chat if we are pretty sure
                const merged = {
                    ...currentIdentity,
                    phone: wppChat.phone,
                    name: wppChat.name || currentIdentity.name,
                    chatId: wppChat.id
                };
                cacheIdentity(merged);
                onUpdate(merged);
                return;
            }
        } catch (e) {
            console.error('[CRM] WPP Content Fetch Failed', e);
        }

        // 3. Passive Drawer Check (Only if already open)
        let drawer = findInfoPanel();
        if (drawer) {
            const phone = extractPhoneFromDrawer(drawer);
            if (phone) {
                console.log('[CRM] Captured via Passive Drawer:', phone);
                cacheIdentity({ ...currentIdentity, phone });
                onUpdate({ ...currentIdentity, phone });
            }
        } else {
            logDebug('Stealth sync: WPP failed & Drawer closed. Aborting intrusive click.');
        }

    } catch (err) {
        console.error('[CRM] Sync error:', err);
    } finally {
        lastAttemptByChatKey.set(chatKey, Date.now());
        isFetchingPhone = false;
        document.body.classList.remove('crm-fetching-phone');
        logDebug('=== SYNC FINISHED ===');
    }
}


const extractPhone = (value?: string | null) => {
    if (!value) return '';
    const match = value.match(/(\d{8,})@/);
    if (match) return match[1];
    const digits = value.replace(/\D/g, '');
    return digits.length >= 8 ? digits : '';
};

const normalizePhoneCandidate = (value?: any) => {
    if (!value) return '';
    if (typeof value === 'string' || typeof value === 'number') return extractPhone(String(value));
    if (typeof value === 'object') {
        if (typeof value.phone === 'string' || typeof value.phone === 'number') return extractPhone(String(value.phone));
        if (typeof value.number === 'string' || typeof value.number === 'number') return extractPhone(String(value.number));
        if (typeof value.user === 'string' || typeof value.user === 'number') return extractPhone(String(value.user));
        if (typeof value._serialized === 'string') return extractPhone(value._serialized);
        if (typeof value.id === 'string' || typeof value.id === 'number') return extractPhone(String(value.id));
        if (value.id && typeof value.id._serialized === 'string') return extractPhone(value.id._serialized);
    }
    if (value && typeof value.toString === 'function') {
        const str = value.toString();
        if (str && str !== '[object Object]') return extractPhone(str);
    }
    return '';
};

const resolvePhoneFromChatModel = (chat?: any) => {
    if (!chat) return '';
    const candidates = [
        chat.phoneNumber,
        chat.contact?.phoneNumber,
        chat.contact?.formattedUser,
        chat.contact?.formattedPhone,
        chat.contact?.userid,
        chat.contact?.id,
        chat.contact?.wid,
        chat.id,
        chat.id?._serialized,
        chat.id?.user
    ];
    for (const value of candidates) {
        const phone = normalizePhoneCandidate(value);
        if (phone) return phone;
    }
    return '';
};


const findChatIdInNode = (node: Element | null) => {
    if (!node) return '';
    const anchor = node.closest('[data-id], [data-entity-id], [data-chat-id]');
    const directId =
        anchor?.getAttribute('data-id') ||
        anchor?.getAttribute('data-entity-id') ||
        anchor?.getAttribute('data-chat-id') ||
        node.getAttribute('data-id') ||
        node.getAttribute('data-entity-id') ||
        node.getAttribute('data-entity-id') ||
        node.getAttribute('data-chat-id');
    if (directId) return directId;
    const child = node.querySelector('[data-id], [data-entity-id], [data-chat-id]');
    return (
        child?.getAttribute('data-id') ||
        child?.getAttribute('data-entity-id') ||
        child?.getAttribute('data-chat-id') ||
        ''
    );
};

const findNameInChatList = () => {
    const selectedRow = document.querySelector('#pane-side [aria-selected="true"]');
    if (!selectedRow) return '';
    const titleSpan = selectedRow.querySelector('span[title]');
    const title = titleSpan?.getAttribute('title') || '';
    if (title.trim()) return title.trim();
    const autoSpan = selectedRow.querySelector('span[dir="auto"]');
    return (autoSpan?.textContent || '').trim();
};

const chatIdentityCache = new Map<string, ChatIdentity>();

const cacheIdentity = (identity: ChatIdentity) => {
    const keys: string[] = [];
    if (identity.chatId) keys.push(`id:${identity.chatId}`);
    if (identity.phone) keys.push(`phone:${identity.phone}`);
    keys.forEach(key => chatIdentityCache.set(key, identity));
};

const getCachedIdentity = (chatId: string, phone: string) => {
    if (chatId && chatIdentityCache.has(`id:${chatId}`)) {
        return chatIdentityCache.get(`id:${chatId}`) || null;
    }
    if (phone && chatIdentityCache.has(`phone:${phone}`)) {
        return chatIdentityCache.get(`phone:${phone}`) || null;
    }
    return null;
};

const findActiveChatId = () => {
    const header = document.querySelector('#main header');
    const headerId = findChatIdInNode(header);
    if (headerId) return headerId;
    const selectedRow = document.querySelector('#pane-side [aria-selected="true"]');
    return findChatIdInNode(selectedRow);
};

const getChatIdFromStore = () => {
    const store = (window as any).Store || (window as any).WPP?.whatsapp?.Store;
    const activeChat =
        store?.Chat?.getActive?.() ||
        store?.Chat?.models?.find((item: any) => item?.active);
    return String(activeChat?.id?._serialized || activeChat?.id?.user || '');
};

const getPhoneFromStore = () => {
    const store = (window as any).Store || (window as any).WPP?.whatsapp?.Store;
    const activeChat =
        store?.Chat?.getActive?.() ||
        store?.Chat?.models?.find((item: any) => item?.active);
    const resolved = resolvePhoneFromChatModel(activeChat);
    if (resolved) return resolved;
    const serialized = activeChat?.id?._serialized || activeChat?.id?.user || '';
    return extractPhone(String(serialized || ''));
};

const findPhoneInInfoPanel = (panel?: Element | null) => {
    const container = panel || findInfoPanel();
    if (container) {
        const phone = findPhoneInContainer(container);
        if (phone) return phone;
    }

    const titleNode = findInfoPanelTitle();
    if (!titleNode) return '';
    let current: Element | null = titleNode.parentElement;
    for (let i = 0; i < 6 && current; i += 1) {
        const phone = findPhoneInContainer(current);
        if (phone) return phone;
        current = current.parentElement;
    }

    return '';
};

const buildChatKey = (chat: ChatIdentity | null, includePhone: boolean) => {
    if (!chat) return '';
    const idPart = chat.chatId || '';
    const phonePart = includePhone ? (chat.phone || '') : '';
    const namePart = isInvalidName(chat.name) ? '' : normalizeNameKey(chat.name || '');
    return `${idPart}|${phonePart}|${namePart}`;
};

export const WhatsAppScraper = {
    waitForElement: (selector: string, timeout = 5000): Promise<Element | null> => {
        return new Promise((resolve) => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    },

    getActiveChat: (): ChatIdentity | null => {
        const mainHeader = document.querySelector('#main header');
        if (!mainHeader) return null;

        // 1. FAST PATH: Check internal WPP Store if available (Avoids DOM completely)
        try {
            const store = (window as any).Store || (window as any).WPP?.whatsapp?.Store;
            const activeChat = store?.Chat?.getActive?.() || store?.Chat?.models?.find((item: any) => item?.active);
            if (activeChat) {
                const id = activeChat.id?._serialized || activeChat.id?.user;
                const name = activeChat.name || activeChat.contact?.name || activeChat.contact?.pushname || '';
                const isGroup = id?.includes('@g.us');
                const phone = isGroup ? '' : (resolvePhoneFromChatModel(activeChat) || extractPhone(String(id || '')));

                // If we have valid data, return immediately.
                if (id && (name || phone)) {
                    const identity = {
                        name: name || 'Desconhecido',
                        phone: phone,
                        avatarUrl: undefined,
                        chatId: id,
                        isBusiness: activeChat.isBusiness
                    };
                    cacheIdentity(identity);
                    return identity;
                }
            }
        } catch (e) { /* ignore store errors */ }

        const avatarImg = mainHeader.querySelector('img') as HTMLImageElement;
        const avatarUrl = avatarImg?.src;

        const headerTitleNode =
            document.querySelector('[data-testid="conversation-info-header-chat-title"]') ||
            mainHeader.querySelector('span[title]');
        const primaryName =
            (headerTitleNode as HTMLElement | null)?.getAttribute?.('title') ||
            (headerTitleNode as HTMLElement | null)?.innerText ||
            '';
        const nameCandidates = Array.from(
            mainHeader.querySelectorAll('span[dir="auto"], span[title], div[title]')
        )
            .map(node => getTextFromElement(node).trim())
            .filter(text => text && !/^[+\d\s-]+$/.test(text))
            .filter(text => !isInvalidName(text));
        const listName = findNameInChatList();
        const validListName = isInvalidName(listName) ? '' : listName;
        const validPrimaryName = isInvalidName(primaryName) ? '' : primaryName;
        const name = validListName || validPrimaryName || nameCandidates[0] || '';

        const chatId = findActiveChatId() || getChatIdFromStore();
        const isGroup = chatId.includes('@g.us');
        const phoneFromChatId = isGroup ? '' : extractPhone(chatId);
        const infoPanel = findInfoPanel();
        const panelPhone = findPhoneInInfoPanel(infoPanel);
        const headerPhone = extractPhoneFromText(getTextFromElement(mainHeader));
        let phone = phoneFromChatId || panelPhone || headerPhone || getPhoneFromStore();
        if (!phone && name && /^[+\d\s-]+$/.test(name) && name.length > 8) {
            phone = name.replace(/\D/g, '');
        }

        const cached = getCachedIdentity(chatId, phone);
        const resolvedName = name || cached?.name || 'Desconhecido';
        const resolvedPhone = phone || cached?.phone || '';
        const resolvedAvatar = avatarUrl || cached?.avatarUrl;
        const identity = {
            name: resolvedName,
            phone: resolvedPhone,
            avatarUrl: resolvedAvatar,
            chatId: chatId || cached?.chatId || undefined,
        };

        cacheIdentity(identity);
        return identity;
    },

    observeChatChanges: (callback: (chat: ChatIdentity | null) => void) => {
        let lastChatKey = '';

        const check = () => {
            if (isFetchingPhone) return;
            // CRITICAL LOCK: Pause sync if we are broadcasting/sending
            if ((window as any).__IVILLAR_IS_SENDING__) {
                logDebug('Ignoring mutation (Global Sending Lock Active)');
                return;
            }

            const current = WhatsAppScraper.getActiveChat();
            const stableChatKey = buildChatKey(current, false);
            if (!stableChatKey.replace(/\|/g, '')) {
                return;
            }

            const currentKey = buildChatKey(current, true);

            if (currentKey !== lastChatKey) {
                logDebug('Chat change detected!', { old: lastChatKey, new: currentKey });
                lastChatKey = currentKey;
                callback(current);

                if (current && stableChatKey) {
                    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
                    // logDebug('Scheduling syncContact in 100ms...');
                    syncDebounceTimer = setTimeout(() => {
                        syncContact(stableChatKey, current, callback);
                    }, 100);
                }
            }
        };

        const observer = new MutationObserver(() => check());
        const mainContainer = document.getElementById('app');
        if (mainContainer) {
            observer.observe(mainContainer, { subtree: true, childList: true });
        }

        document.addEventListener('click', () => setTimeout(check, 500), true);
        document.addEventListener('keyup', (e) => { if (e.key === 'Enter') setTimeout(check, 500) }, true);

        check();

        return () => {
            observer.disconnect();
        };
    },

    syncAddressBook: async (
        onProgress: (count: number) => void,
        options?: { mode?: 'cache' | 'crm' }
    ) => {
        logDebug('syncAddressBook: triggered');
        const syncMode = options?.mode === 'crm' ? 'crm' : 'cache';

        try {
            // 1. Get Owner ID
            const ownerId = await WhatsAppScraper.getMe();
            console.log('[CRM SYNC] Owner ID:', ownerId);
            if (!ownerId) {
                console.warn('[CRM SYNC] Missing Owner ID, aborting sync');
                onProgress(0);
                return;
            }
            const normalizeTextKey = (value: string) =>
                value
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .trim();
            const isSystemPhone = (value: string) => {
                const digits = String(value || '').replace(/\D/g, '');
                if (!digits) return false;
                return /^1\d{3}5550\d{3}$/.test(digits) || /^\d{3}5550\d{3}$/.test(digits);
            };
            const isSystemContact = (lead: { name?: string; phone?: string }) => {
                const digits = String(lead.phone || '').replace(/\D/g, '');
                if (digits && (digits.length < 8 || digits.length > 13)) return true;
                const nameKey = normalizeTextKey(String(lead.name || ''));
                if (nameKey.includes('meta ai') || nameKey.includes('whatsapp') || nameKey.includes('support')) return true;
                return isSystemPhone(digits);
            };

            // 2. Get Contacts via WPPConnect (Injected)
            const contacts = await new Promise<any[]>((resolve) => {
                const listener = (event: MessageEvent) => {
                    if (event.data.type === 'CRM_CONTACTS_SUCCESS') {
                        window.removeEventListener('message', listener);
                        resolve(event.data.contacts);
                    }
                    if (event.data.type === 'CRM_CONTACTS_ERROR') {
                        window.removeEventListener('message', listener);
                        resolve([]);
                    }
                };
                window.addEventListener('message', listener);
                window.postMessage({ type: 'CRM_GET_CONTACTS' }, '*');
                setTimeout(() => {
                    window.removeEventListener('message', listener);
                    resolve([]);
                }, 10000);
            });

            logDebug(`syncAddressBook: Found ${contacts.length} contacts via WPPConnect`);

            if (contacts.length === 0) {
                onProgress(0);
                return;
            }

            // 3. Map & Enrich
            const leads = contacts.map((c: any) => {
                let phone = String(c.phone || c.number || '').replace(/\D/g, '');
                if (!phone && typeof c.id === 'string' && c.id.endsWith('@c.us')) {
                    phone = c.id.split('@')[0].replace(/\D/g, '');
                }

                return {
                    id: c.id, // c.id is _serialized string
                    name: c.name || c.pushname || c.verifiedName || 'Sem Nome',
                    phone,
                    isBusiness: c.isBusiness,
                    avatarUrl: c.profilePicThumbObj?.eurl,
                    ownerId: ownerId, // ISOLATION KEY
                    source: 'whatsapp_import'
                };
            }).filter((lead) => Boolean(lead.phone) && !isSystemContact(lead));

            // 4. Send Batch
            await sendRuntimeMessage({ type: 'SYNC_CONTACTS_BATCH', leads, ownerId, mode: syncMode });

            onProgress(leads.length);
        } catch (e) {
            console.error('Sync failed', e);
            onProgress(0);
        }
    },

    insertMessage: (text: string) => {
        const mainFooter = document.querySelector('#main footer');
        if (!mainFooter) {
            logBroadcast('insertMessage: main footer not found');
            return false;
        }

        const input = mainFooter.querySelector('div[contenteditable="true"]');
        if (input) {
            const normalized = String(text || '').replace(/\r\n/g, '\n');
            const element = input as HTMLElement;
            element.focus();

            try {
                const data = new DataTransfer();
                data.setData('text/plain', normalized);
                const pasteEvent = new ClipboardEvent('paste', {
                    clipboardData: data,
                    bubbles: true
                } as ClipboardEventInit);
                element.dispatchEvent(pasteEvent);
            } catch {
                document.execCommand('insertText', false, normalized);
            }

            input.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }
        logBroadcast('insertMessage: input not found');
        return false;
    },

    clickSend: async () => {
        const mainFooter = document.querySelector('#main footer');
        if (!mainFooter) {
            logBroadcast('clickSend: main footer not found');
            return false;
        }

        const findButton = () => {
            return mainFooter.querySelector('button[aria-label="Send"]') ||
                mainFooter.querySelector('button[aria-label="Enviar"]') ||
                mainFooter.querySelector('[data-icon="send"]') ||
                mainFooter.querySelector('span[data-icon="send"]')?.closest('button');
        };

        let sendBtn = findButton();
        if (!sendBtn) {
            for (let i = 0; i < 5; i++) {
                await new Promise(r => setTimeout(r, 200));
                sendBtn = findButton();
                if (sendBtn) break;
            }
        }

        if (sendBtn) {
            logBroadcast('clickSend: sending via button');
            (sendBtn as HTMLElement).click();
            return true;
        }

        logBroadcast('clickSend: button not found, trying ENTER fallback');
        const input = mainFooter.querySelector('div[contenteditable="true"]');
        if (input) {
            (input as HTMLElement).focus();
            const event = new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                key: 'Enter',
                code: 'Enter',
                keyCode: 13
            });
            input.dispatchEvent(event);
            return true;
        }

        logBroadcast('clickSend: failed (no button or input)');
        return false;
    },

    openChat: async (phone: string, name?: string): Promise<boolean> => {
        (window as any).__IVILLAR_IS_SENDING__ = true;
        try {
            logBroadcast('openChat: start', phone, 'name:', name);
            const cleanPhone = phone.replace(/\D/g, '');
            const targetDigits = cleanPhone.slice(-5);
            const cleanTargetName = name ? normalizeNameKey(name) : '';

            const side = document.querySelector('#side');
            if (!side) return false;

            const searchInput = side.querySelector('div[contenteditable="true"]');
            if (!searchInput) return false;

            const nativeInput = searchInput as HTMLElement;
            nativeInput.focus();

            // v1 Logic: Standard execCommand
            document.execCommand('selectAll', false);
            document.execCommand('delete', false);
            await new Promise(r => setTimeout(r, 200));

            for (const char of phone) {
                // v1: Just type, no panic checks

                document.execCommand('insertText', false, char);
                nativeInput.dispatchEvent(new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: char,
                    view: window
                }));
                await new Promise(r => setTimeout(r, 150));
            }

            nativeInput.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(r => setTimeout(r, 800));

            let searchResults: NodeListOf<Element> = document.querySelectorAll('._placeholder_');
            let pollAttempts = 0;
            const MAX_POLL_ATTEMPTS = 15;

            while (pollAttempts < MAX_POLL_ATTEMPTS) {
                await new Promise(r => setTimeout(r, 600));

                const inputValue = (nativeInput as any).value || nativeInput.textContent;
                logBroadcast(`openChat: searchInput value: "${inputValue}"`);

                // DEBUG: Inspect all potential lists
                const listboxes = document.querySelectorAll('[role="listbox"]');
                const options = document.querySelectorAll('[role="option"]');
                const listitems = document.querySelectorAll('[role="listitem"]');

                logBroadcast(`openChat: DEBUG SCAN -> listbox: ${listboxes.length}, option: ${options.length}, listitem: ${listitems.length}`);

                [listboxes, options, listitems].forEach((list, idx) => {
                    const type = idx === 0 ? 'listbox' : idx === 1 ? 'option' : 'listitem';
                    if (list.length > 0) {
                        const preview = Array.from(list).slice(0, 3).map(el => (el as HTMLElement).innerText.slice(0, 30).replace(/\n/g, ' '));
                        logBroadcast(`openChat: DEBUG ${type} head: ${JSON.stringify(preview)}`);
                    }
                });

                // STRATEGY 1: TARGETED SEARCH (Refined based on user feedback)
                // We want the specific listbox that appears for search results
                // Usually it is a div with role="listbox" inside #side
                // OR a div with role="grid" (recent update)
                // We prioritize containers that look like contact lists

                const potentialContainers = Array.from(document.querySelectorAll('#side div[role="listbox"], #side div[role="grid"], #side div[role="rowgroup"]'));
                let bestContainer: { el: Element, count: number, items: NodeListOf<Element> } | null = null;

                // Also consider the raw listitems globally if no specific container found
                const globalListItems = document.querySelectorAll('#side div[role="listitem"], div[role="button"]');


                if (potentialContainers.length > 0) {
                    const candidates = potentialContainers.map(el => {
                        const items = el.querySelectorAll('div[role="listitem"], div[role="button"]');
                        return { el, count: items.length, items };
                    }).sort((a, b) => b.count - a.count);

                    if (candidates.length > 0) {
                        // Filter out banner-only containers
                        bestContainer = candidates[0];
                        const isBanner = (text: string) => {
                            const t = text.toLowerCase();
                            return t.includes('baixar') || t.includes('use o app') || t.includes('histórico') || t.includes('desbloquear');
                        };

                        // FIX: Cast to HTMLElement for innerText
                        if (bestContainer.count <= 2 && isBanner((bestContainer.el as HTMLElement).innerText || '')) {
                            logBroadcast('openChat: Best container rejected (Banner detected). Trying next.');
                            if (candidates.length > 1) {
                                bestContainer = candidates[1];
                            } else {
                                bestContainer = null;
                            }
                        }
                    }
                }

                if (bestContainer) {
                    searchResults = bestContainer.items as any;
                    logBroadcast(`openChat: Focused on container with ${searchResults.length} items.`);
                } else if (globalListItems.length > 0) {
                    logBroadcast(`openChat: No specific container found. Using Global Scan (${globalListItems.length} items).`);
                    searchResults = globalListItems as any;
                } else {
                    searchResults = document.querySelectorAll('._placeholder_');
                }

                // End of polling attempt
                if (searchResults.length > 0) break;
                pollAttempts++;
            } // END WHILE LOOP

            logBroadcast(`openChat: found ${searchResults.length} potential results (Ranked+Fallback)`);

            // Initialize bestCandidate variables in outer scope
            let bestCandidate: HTMLElement | null = null;
            let maxScore = 0;

            for (const row of Array.from(searchResults)) {
                const element = row as HTMLElement;
                const ariaLabel = element.getAttribute('aria-label') || '';
                const title = element.getAttribute('title') || '';
                const rawText = element.innerText || element.textContent || '';
                const allText = `${rawText} ${ariaLabel} ${title}`.toLowerCase();
                const cleanText = allText.replace(/\D/g, '');
                const normalizedRowText = normalizeNameKey(allText);

                logBroadcast(`openChat: scanning row`, {
                    text: allText.slice(0, 40),
                    cleanText: cleanText.slice(0, 10)
                });

                if (
                    allText.includes('baixar o whatsapp') ||
                    allText.includes('use o app para acessar') ||
                    allText.includes('mensagens pessoais') ||
                    allText.includes('mostrar status')
                ) {
                    logBroadcast('openChat: skip - BANNER/STATUS DETECTED');
                    continue;
                }

                if (rawText.length > 200 && !cleanText.includes(targetDigits)) {
                    logBroadcast('openChat: skip - text too long');
                    continue;
                }
                if (allText.includes('meta ai') || allText.includes('ideias de') || allText.includes('escrever uma')) {
                    logBroadcast('openChat: skip - Meta AI');
                    continue;
                }
                if (rawText.includes('Status') || rawText.includes('status')) {
                    if (!cleanText.includes(targetDigits) && !cleanTargetName) {
                        logBroadcast('openChat: skip - likely Status row');
                        continue;
                    }
                }

                let score = 0;
                if (cleanText.endsWith(targetDigits) || cleanText.includes(targetDigits)) {
                    score += 100;
                    logBroadcast('openChat: +100 Phone Match');
                }
                if (cleanTargetName && normalizedRowText.includes(cleanTargetName)) {
                    score += 50;
                    logBroadcast('openChat: +50 Name Match');
                } else if (cleanTargetName) {
                    const parts = cleanTargetName.split(' ').filter(p => p.length > 2);
                    if (parts.length > 0 && parts.every(p => normalizedRowText.includes(p))) {
                        score += 30;
                        logBroadcast('openChat: +30 Fuzzy Name Match');
                    }
                }

                if (score > maxScore) {
                    maxScore = score;
                    bestCandidate = element;
                }
            }

            // CRITICAL FIX: If no candidate was found (even if we found banners),
            // and we have a name, FORCE a text search for the name.
            if (!bestCandidate && cleanTargetName) {
                logBroadcast('openChat: Results found but rejected (Banners?). Forcing Text/Name Fallback.');
                const sidePanel = document.querySelector('#side') || document.body;
                const textNodes: Element[] = [];

                if (cleanTargetName) {
                    const parts = cleanTargetName.split(' ').filter(p => p.length > 3);
                    if (parts.length > 0) {
                        // Simplify: search for the longest name part first
                        parts.sort((a, b) => b.length - a.length);
                        const bestPart = parts[0];
                        logBroadcast(`openChat: Forcing Name Fallback search for "${bestPart}"`);
                        logBroadcast(`openChat: Forcing Name Fallback search for "${bestPart}"`);

                        // JS-based search is more robust for case-insensitivity and "innerText" view
                        try {
                            const allCandidates = sidePanel.querySelectorAll('div[role="listitem"], div[role="button"], span[title], div[title]');
                            for (const candidate of Array.from(allCandidates)) {
                                if (candidate instanceof HTMLElement) {
                                    // Check normalized text
                                    const text = (candidate.innerText || candidate.textContent || '').toLowerCase();
                                    const normalizedText = normalizeNameKey(text);

                                    // Simple check: does it contain our target part?
                                    if (normalizedText.includes(bestPart)) {
                                        // Find actionable parent
                                        const clickable = candidate.closest('div[role="listitem"], div[role="button"]') || candidate;
                                        if (clickable && !textNodes.includes(clickable)) {
                                            textNodes.push(clickable);
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            logBroadcast('openChat: JS fallback error', e);
                        }
                    }
                }

                if (textNodes.length > 0) {
                    logBroadcast(`openChat: Force Fallback found ${textNodes.length} items`);
                    // Use these new candidates
                    searchResults = textNodes as any; // Cast as any to assign Element[] to NodeListOf

                    // Reset validation loop for these new items
                    for (const row of Array.from(searchResults)) {
                        const element = row as HTMLElement;
                        const rawText = element.innerText || '';
                        const normalizedRowText = normalizeNameKey(rawText);

                        let score = 0;
                        if (cleanTargetName && normalizedRowText.includes(cleanTargetName)) {
                            score += 50;
                        } else if (cleanTargetName) {
                            const parts = cleanTargetName.split(' ').filter(p => p.length > 2);
                            if (parts.length > 0 && parts.every(p => normalizedRowText.includes(p))) {
                                score += 30;
                            }
                        }

                        if (score > maxScore) {
                            maxScore = score;
                            bestCandidate = element;
                        }
                    }
                }
            }

            if (bestCandidate && maxScore > 0) {
                logBroadcast(`openChat: clicking best candidate (Score: ${maxScore})`, (bestCandidate.innerText || '').slice(0, 20));
                simulateClick(bestCandidate);
            } else {
                logBroadcast('openChat: NO GOOD CANDIDATE FOUND.');
                return false;
            }

            await new Promise(r => setTimeout(r, 1000));
            let footerFound = false;
            for (let i = 0; i < 5; i++) {
                if (document.querySelector('#main footer')) {
                    footerFound = true;
                    break;
                }
                await new Promise(r => setTimeout(r, 800));
            }

            if (!footerFound) {
                await new Promise(r => setTimeout(r, 1500));
                if (document.querySelector('#main footer')) footerFound = true;
            }

            let active = WhatsAppScraper.getActiveChat();
            let attempts = 0;
            while (attempts < 5) {
                const tempName = (active?.name || '').toLowerCase();
                const tempPhone = (active?.phone || '').replace(/\D/g, '');
                if (tempPhone === cleanPhone) break;
                if (!tempName && !tempPhone) {
                    await new Promise(r => setTimeout(r, 800));
                    active = WhatsAppScraper.getActiveChat();
                    attempts++;
                } else {
                    break;
                }
            }

            const activeName = (active?.name || '').toLowerCase();
            const activePhone = (active?.phone || '').replace(/\D/g, '');

            if (activePhone === cleanPhone || (name && activeName.includes(name.toLowerCase()))) {
                logBroadcast('openChat: verified match!', cleanPhone);
                return true;
            }

            logBroadcast('openChat: verification mismatch. Active:', activeName, activePhone, 'Expected:', cleanTargetName, cleanPhone);

            if (activeName.includes('mensagens para mim') || activeName.includes('messages to self') || activeName.includes('me (you)')) return false;
            if (activeName.includes('meta ai')) return false;
            if (!footerFound) return false;
            if (activePhone && activePhone !== cleanPhone) return false;

            if (!activePhone) {
                if (activeName && cleanTargetName && !activeName.includes(cleanTargetName) && !cleanTargetName.includes(activeName)) {
                    logBroadcast('openChat: WARNING - Name mismatch too!');
                }
            }

            return true;
        } catch (e) {
            logBroadcast('openChat: GENERIC ERROR', e);
            return false;
        } finally {
            (window as any).__IVILLAR_IS_SENDING__ = false;
        }
    },

    getRecentMessages: (limit = 20): ChatMessage[] => {
        // ... (keep existing implementation)
        const main = document.getElementById('main');
        if (!main) return [];

        const nodes = Array.from(main.querySelectorAll('[data-pre-plain-text]'));
        const messages = nodes.map((node, index) => {
            const container = node as HTMLElement;
            const textEl = container.querySelector('span.selectable-text, div.selectable-text') as HTMLElement | null;

            let text = textEl?.innerText?.trim() || '';
            if (!text) {
                const img = container.querySelector('img[alt]');
                if (img) text = `[Image: ${img.getAttribute('alt')}]`;
            }

            const cleanTs = (node.getAttribute('data-pre-plain-text') || '')
                .replace('[', '')
                .replace(']', '')
                .split(',')
                .shift()
                ?.trim();

            const row = container.closest('div[role="row"]');
            const direction = row?.classList.contains('message-out') ? 'out' : 'in';

            return {
                id: `msg-${index}-${Date.now()}`,
                direction: direction as 'in' | 'out',
                text: text,
                timestamp: cleanTs
            };
        });

        return messages.slice(-limit);
    },

    // --- NEW WPPCONNECT METHODS ---

    getWppChats: async (): Promise<any[]> => {
        try {
            logDebug('Calling WPP.chat.list via injection...');

            // Bridge: scraper (isolated) -> injected (main) via postMessage
            return new Promise((resolve) => {
                const listener = (event: MessageEvent) => {
                    if (event.data.type === 'CRM_CHATS_SUCCESS') {
                        window.removeEventListener('message', listener);
                        resolve(event.data.chats);
                    }
                    if (event.data.type === 'CRM_CHATS_ERROR') {
                        window.removeEventListener('message', listener);
                        console.error('CRM_CHATS_ERROR', event.data.error);
                        resolve([]);
                    }
                };
                window.addEventListener('message', listener);
                window.postMessage({ type: 'CRM_GET_CHATS' }, '*');

                // Timeout
                setTimeout(() => {
                    window.removeEventListener('message', listener);
                    resolve([]);
                }, 5000);
            });
        } catch (e) {
            console.error('getWppChats error', e);
            return [];
        }
    },

    getWppContacts: async (): Promise<any[]> => {
        try {
            return new Promise((resolve) => {
                const listener = (event: MessageEvent) => {
                    if (event.data.type === 'CRM_CONTACTS_SUCCESS') {
                        window.removeEventListener('message', listener);
                        resolve(event.data.contacts);
                    }
                    if (event.data.type === 'CRM_CONTACTS_ERROR') {
                        window.removeEventListener('message', listener);
                        console.error('CRM_CONTACTS_ERROR', event.data.error);
                        resolve([]);
                    }
                };
                window.addEventListener('message', listener);
                window.postMessage({ type: 'CRM_GET_CONTACTS' }, '*');

                setTimeout(() => {
                    window.removeEventListener('message', listener);
                    resolve([]);
                }, 8000);
            });
        } catch (e) {
            console.error('getWppContacts error', e);
            return [];
        }
    },

    getMe: async (): Promise<string | null> => {
        try {
            return new Promise((resolve) => {
                const listener = (event: MessageEvent) => {
                    if (event.data.type === 'CRM_ME_SUCCESS') {
                        window.removeEventListener('message', listener);
                        resolve(event.data.me);
                    }
                    if (event.data.type === 'CRM_ME_ERROR') {
                        window.removeEventListener('message', listener);
                        resolve(null);
                    }
                };
                window.addEventListener('message', listener);
                window.postMessage({ type: 'CRM_GET_ME' }, '*');
                setTimeout(() => {
                    window.removeEventListener('message', listener);
                    resolve(null);
                }, 2000);
            });
        } catch {
            return null;
        }
    },

    fetchActiveChatWPP: async (): Promise<any | null> => {
        try {
            return new Promise((resolve) => {
                const listener = (event: MessageEvent) => {
                    if (event.data.type === 'CRM_ACTIVE_CHAT_SUCCESS') {
                        window.removeEventListener('message', listener);
                        resolve(event.data.chat);
                    }
                    if (event.data.type === 'CRM_ACTIVE_CHAT_ERROR') {
                        window.removeEventListener('message', listener);
                        resolve(null);
                    }
                };
                window.addEventListener('message', listener);
                window.postMessage({ type: 'CRM_GET_ACTIVE_CHAT' }, '*');
                setTimeout(() => {
                    window.removeEventListener('message', listener);
                    resolve(null);
                }, 1500);
            });
        } catch {
            return null;
        }
    },

    sendInvisible: async (phone: string, text: string, chatId?: string): Promise<boolean> => {
        return new Promise((resolve) => {
            const listener = (event: MessageEvent) => {
                if (event.data.type === 'CRM_SEND_SUCCESS' && event.data.phone === phone) {
                    window.removeEventListener('message', listener);
                    resolve(true);
                }
                if (event.data.type === 'CRM_SEND_ERROR' && event.data.phone === phone) {
                    window.removeEventListener('message', listener);
                    console.error('CRM_SEND_ERROR', event.data.error);
                    resolve(false);
                }
            };
            window.addEventListener('message', listener);
            window.postMessage({ type: 'CRM_SEND_INVISIBLE', phone, text, chatId }, '*');

            // Timeout
            setTimeout(() => {
                window.removeEventListener('message', listener);
                resolve(false);
            }, 10000);
        });
    }
};
