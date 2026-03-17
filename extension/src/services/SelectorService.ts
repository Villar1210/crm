const CONFIG_API_URL = 'http://localhost:3001/api/config/selectors';
const STORAGE_KEY = 'crm_scraper_selectors';

// Default Fallback Selectors (Current Working State)
const DEFAULT_SELECTORS: Record<string, string> = {
    SIDE_PANEL: '#side',
    SIDE_PANEL_ALT: '#pane-side', // Sometime used
    SEARCH_INPUT: 'div[contenteditable="true"][data-tab="3"]',
    SEARCH_RESULT_ROW: 'div[role="listitem"]',
    SEARCH_RESULT_BUTTON: 'div[role="button"]',
    CHAT_HEADER: '#main header',
    CHAT_HEADER_TITLE: 'span[title]',
    MESSAGE_INPUT_CONTAINER: '#main footer',
    MESSAGE_INPUT: 'div[contenteditable="true"][data-tab="10"]',
    BTN_SEND: 'span[data-icon="send"]',
    BTN_ATTACH: 'span[data-icon="clip"]',
    BTN_CLEAR_SEARCH: 'span[data-icon="x-alt"]',
    MENU_DROPDOWN: 'div[role="button"][aria-label="Mais opções"]', // "Menu" or "More options"
};

let cache: Record<string, string> = { ...DEFAULT_SELECTORS };

export const SelectorService = {
    /**
     * Initialize keys from storage or server
     */
    init: async () => {
        try {
            // 1. Try Load from Storage (Fastest)
            const result = await chrome.storage.local.get(STORAGE_KEY);
            if (result[STORAGE_KEY]) {
                cache = { ...DEFAULT_SELECTORS, ...result[STORAGE_KEY] };
                // console.log('[SelectorService] Loaded from cache');
            }

            // 2. Refresh from Server (Background)
            // Note: In Content Script, we might need to ask Background Script to proxy this if direct fetch fails (CORS).
            // But usually extension host permissions allow localhost fetch.
            fetch(CONFIG_API_URL)
                .then(res => res.json())
                .then(data => {
                    if (data && typeof data === 'object') {
                        cache = { ...DEFAULT_SELECTORS, ...data };
                        // Persist new config
                        chrome.storage.local.set({ [STORAGE_KEY]: cache });
                        console.log('[SelectorService] Config updated from server', Object.keys(data).length);
                    }
                })
                .catch(err => {
                    console.warn('[SelectorService] Failed to update config', err);
                });

        } catch (e) {
            console.error('[SelectorService] Init error', e);
        }
    },

    /**
     * Get a selector by key
     */
    get: (key: string): string => {
        return cache[key] || DEFAULT_SELECTORS[key] || '';
    },

    /**
     * Get all currently active selectors
     */
    getAll: () => cache
};
