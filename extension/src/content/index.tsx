import { createRoot } from 'react-dom/client';
import App from '../App';
import styleText from '../index.css?inline'; // Import styles as string
import { WhatsAppScraper } from './scraper';

declare global {
    interface Window {
        __IVILLAR_MOUNTED__?: boolean;
        __CRM_TOOL_ACTIONS__?: boolean;
    }
}

console.log('[CRM DEBUG] Script Loaded');

const injectGlobalStealthStyles = () => {
    // ... logic remains same, just ensuring we don't mess up imports
    const style = document.createElement('style');
    style.id = 'crm-stealth-styles';
    // ...
    // ... (skipping to tryInjectSidebar to keep edit minimal in this chunk if possible, but replace_file_content needs contiguous block)
    // Let's replace the top block first to define the type.
    style.textContent = `
        /* Hide drawer when automation is running */
        body.crm-fetching-phone div[data-animate-drawer-right],
        body.crm-fetching-phone div[role="dialog"],
        body.crm-fetching-phone aside[aria-label="Dados do contato"],
        body.crm-fetching-phone aside[aria-label="Contact info"] {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
            position: absolute !important;
            z-index: -9999 !important;
        }

        /* Hide New Chat / Contact List when syncing */
        body.crm-syncing-contacts div[data-animate-modal-popup],
        body.crm-syncing-contacts div[aria-label="Nova conversa"],
        body.crm-syncing-contacts div[aria-label="New chat"],
        body.crm-syncing-contacts div[role="dialog"] {
             opacity: 0 !important;
             visibility: hidden !important;
             pointer-events: none !important;
             position: absolute !important;
             z-index: -9999 !important;
        }
    `;
    document.head.appendChild(style);
};

const injectScript = (file: string) => {
    try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(file);
        script.onload = () => {
            console.log(`[CRM DEBUG] ${file} loaded and script tag removed`);
            script.remove();
        };
        (document.head || document.documentElement).appendChild(script);
    } catch (e) {
        console.error(`[CRM DEBUG] Injection failed for ${file}`, e);
    }
};

// Inject WPPConnect FIRST
injectScript('wppconnect.js');
// Then inject our logic
setTimeout(() => injectScript('injected.js'), 500); // Small delay to ensure WPP loads? Actually script load order isn't guaranteed with async append.
// Better: make injectScript return promise?
// For now, WPPConnect is large, injected.js is small. injected.js waits for window.WPP anyway.

injectGlobalStealthStyles();

function sendRuntimeMessage<T>(message: any): Promise<T> {
    return new Promise((resolve, reject) => {
        try {
            if (typeof chrome === 'undefined' || !chrome.runtime) {
                reject(new Error('Chrome runtime not available'));
                return;
            }
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve(response);
            });
        } catch (error) {
            reject(error);
        }
    });
}

const resolveActiveChat = async () => {
    const wppChat = await WhatsAppScraper.fetchActiveChatWPP();
    if (wppChat?.phone) {
        return wppChat;
    }
    const fallback = WhatsAppScraper.getActiveChat();
    if (!fallback) return null;
    return {
        ...fallback,
        isGroup: typeof fallback.chatId === 'string' ? fallback.chatId.includes('@g.us') : false
    };
};

const fetchActiveLead = async (chat: { phone?: string; name?: string }) => {
    if (!chat?.phone) return null;
    const ownerId = await WhatsAppScraper.getMe();
    const response = await sendRuntimeMessage<{ lead?: any; error?: string }>({
        type: 'FETCH_LEAD',
        phone: chat.phone,
        name: chat.name,
        ownerId
    });
    return response?.lead || null;
};

const pickTransferAgent = async () => {
    const response = await sendRuntimeMessage<{ agents?: any[]; error?: string }>({
        type: 'FETCH_ROULETTE_AGENTS'
    });
    const agents = Array.isArray(response?.agents) ? response.agents : [];
    if (!agents.length) {
        window.alert('Nenhum agente disponivel para transferencia.');
        return null;
    }

    const available = agents.filter((agent) => agent?.status !== 'offline');
    const list = available.length ? available : agents;
    const optionsText = list
        .map((agent, index) => {
            const label = agent?.name || agent?.email || agent?.id || `Agente ${index + 1}`;
            const status = agent?.status ? ` - ${agent.status}` : '';
            return `${index + 1} - ${label}${status}`;
        })
        .join('\n');
    const selection = window.prompt(
        `Transferir atendimento para:\n${optionsText}\nDigite o numero do agente:`
    );
    if (!selection) return null;
    const selectedIndex = Number(selection) - 1;
    if (!Number.isFinite(selectedIndex) || selectedIndex < 0 || selectedIndex >= list.length) {
        window.alert('Selecao invalida.');
        return null;
    }
    return list[selectedIndex];
};

const handleTransferAttendance = async () => {
    const activeChat = await resolveActiveChat();
    if (!activeChat?.phone) {
        window.alert('Selecione um chat para transferir o atendimento.');
        return;
    }
    if (activeChat.isGroup) {
        window.alert('Transferencia indisponivel para grupos.');
        return;
    }
    const agent = await pickTransferAgent();
    if (!agent) return;

    const lead = await fetchActiveLead(activeChat);
    if (!lead?.id) {
        window.alert('Lead nao encontrado. Salve o CRM antes de transferir.');
        return;
    }

    const response = await sendRuntimeMessage<{ lead?: any; error?: string }>({
        type: 'SAVE_LEAD',
        leadId: lead.id,
        payload: { assignedTo: agent.id }
    });

    if (response?.error) {
        window.alert('Falha ao transferir atendimento.');
        return;
    }

    const label = agent?.name || agent?.email || agent?.id || 'agente';
    window.alert(`Atendimento transferido para ${label}.`);
};

const handleCloseAttendance = async () => {
    const activeChat = await resolveActiveChat();
    if (!activeChat?.phone) {
        window.alert('Selecione um chat para encerrar o atendimento.');
        return;
    }
    if (activeChat.isGroup) {
        window.alert('Encerramento indisponivel para grupos.');
        return;
    }
    const statusInput = window.prompt('Status final do atendimento', 'Arquivado');
    if (statusInput == null) return;
    const nextStatus = statusInput.trim();
    if (!nextStatus) return;
    const confirmed = window.confirm(
        `Encerrar atendimento e atualizar status para "${nextStatus}"?`
    );
    if (!confirmed) return;

    const lead = await fetchActiveLead(activeChat);
    if (!lead?.id) {
        window.alert('Lead nao encontrado. Salve o CRM antes de encerrar.');
        return;
    }

    const response = await sendRuntimeMessage<{ lead?: any; error?: string }>({
        type: 'SAVE_LEAD',
        leadId: lead.id,
        payload: { status: nextStatus }
    });

    if (response?.error) {
        window.alert('Falha ao encerrar atendimento.');
        return;
    }

    window.alert('Atendimento encerrado.');
};

const attachToolListeners = () => {
    if (window.top !== window) {
        return;
    }
    if (window.__CRM_TOOL_ACTIONS__) {
        return;
    }
    window.__CRM_TOOL_ACTIONS__ = true;

    window.addEventListener('message', (event: MessageEvent) => {
        if (!event?.data || typeof event.data.type !== 'string') return;
        if (event.data.type === 'CRM_TOOL_TRANSFER') {
            handleTransferAttendance().catch((error) => {
                console.error('[CRM] Transfer failed', error);
                window.alert('Falha ao transferir atendimento.');
            });
        }
        if (event.data.type === 'CRM_TOOL_CLOSE') {
            handleCloseAttendance().catch((error) => {
                console.error('[CRM] Close failed', error);
                window.alert('Falha ao encerrar atendimento.');
            });
        }
    });
};

attachToolListeners();

function tryInjectSidebar() {
    if (window.top !== window) {
        return false;
    }

    // RESTORE: specific ID used by App.tsx
    const rootId = 'whatsapp-crm-extension-root';
    const isWhatsApp = window.location.hostname === 'web.whatsapp.com';

    // STRICT GUARD: If already injected (flag or DOM), abort immediately.
    // The flag is the primary source of truth for the script execution state.
    if (window.__IVILLAR_MOUNTED__ || document.getElementById(rootId)) {
        console.log('[CRM DEBUG] Sidebar already injected (Guard), skipping.');
        return false;
    }

    // Set flag immediately to block concurrent injections
    window.__IVILLAR_MOUNTED__ = true;

    // Double check DOM just in case
    if (document.getElementById(rootId)) {
        console.log('[CRM DEBUG] Sidebar found in DOM, aborting.');
        return false;
    }

    console.log('[CRM DEBUG] Injecting sidebar...');
    const rootDiv = document.createElement('div');
    rootDiv.id = rootId;

    const shadowRoot = rootDiv.attachShadow({ mode: 'open' });
    const shadowWrapper = document.createElement('div');
    shadowWrapper.id = 'shadow-wrapper';
    shadowRoot.appendChild(shadowWrapper);

    // Inject Tailwind Styles into Shadow DOM
    const tailwindStyle = document.createElement('style');
    tailwindStyle.textContent = styleText;
    shadowRoot.appendChild(tailwindStyle);

    const style = document.createElement('style');
    // NOTE: Removed fixed width from CSS. Width will be controlled by React App style or JS.
    style.textContent = `
        #shadow-wrapper {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            background: transparent;
            z-index: 2147483647;
            display: flex;
            transition: width 0.3s ease;
            box-sizing: border-box;
            pointer-events: none; /* Let clicks pass through empty areas if any */
        }
        #shadow-wrapper > * {
            pointer-events: auto; /* Re-enable clicks for children */
            box-sizing: border-box;
        }
    `;
    shadowRoot.appendChild(style);
    document.body.appendChild(rootDiv);

    // Resize Logic
    let currentWidth = 64; // Default start width

    const adjustWhatsAppLayout = (width: number) => {
        currentWidth = width;
        const shadowWrapperEl = shadowWrapper;

        // Adjust the shadow wrapper width itself
        if (shadowWrapperEl) {
            shadowWrapperEl.style.width = `${width}px`;
        }

        if (!isWhatsApp) {
            return;
        }

        const appContainer = document.getElementById('app');

        // Adjust WhatsApp main container
        if (appContainer) {
            appContainer.style.width = `calc(100% - ${width}px)`;
            appContainer.style.marginLeft = `${width}px`;
        }
    };

    // Initial Adjustment
    adjustWhatsAppLayout(64);

    const observer = new MutationObserver((_mutations) => {
        if (!isWhatsApp) return;
        const appContainer = document.getElementById('app');
        // If WA resets styles, we re-apply our margin
        if (appContainer && appContainer.style.marginLeft !== `${currentWidth}px`) {
            adjustWhatsAppLayout(currentWidth);
        }
    });

    // Observe body for #app appearance if not found
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    try {
        const root = createRoot(shadowWrapper);
        // Pass the resize function to the App
        root.render(<App onWidthChange={adjustWhatsAppLayout} />);
        console.log('[CRM DEBUG] App rendered');
    } catch (e) {
        console.error('[CRM DEBUG] Render error:', e);
    }

    return true;
}

// Polling
const interval = setInterval(() => {
    if (tryInjectSidebar()) {
        clearInterval(interval);
    }
}, 1000);
