// Background Service Worker
// Handles storage, API requests, and cross-origin communication

console.log('[IVILLAR CRM] Background Service Worker Loaded');

const STORAGE_KEY = 'ivillar_crm_settings';
const DEFAULT_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const DEFAULT_APP_URL = import.meta.env.VITE_APP_URL || 'https://localhost:5173/#/admin/crm';
const DEFAULT_SETTINGS = {
    baseUrl: DEFAULT_BASE_URL,
    token: '',
    appUrl: DEFAULT_APP_URL
};

const HEALTH_PATH = 'health';
const RESOLVE_TTL_MS = 30000;
let cachedBaseUrl: string | null = null;
let cachedAt = 0;

// Listen for messages from Content Script / Popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    handleMessage(message, sendResponse);
    return true; // Keep channel open for async response
});

async function handleMessage(message: any, sendResponse: (response: any) => void) {
    try {
        switch (message.type) {
            case 'GET_SETTINGS': {
                const settings = await getSettings();
                sendResponse({ settings });
                break;
            }

            case 'SET_SETTINGS':
                await chrome.storage.local.set({ [STORAGE_KEY]: message.settings });
                sendResponse({ success: true });
                break;
            case 'PING_APP_URL':
                await handlePingAppUrl(message, sendResponse);
                break;

            case 'FETCH_LEAD':
                await handleFetchLead(message, sendResponse);
                break;
            case 'FETCH_LEADS':
                await handleFetchLeads(message, sendResponse);
                break;
            case 'FETCH_PROPERTIES':
                await handleFetchProperties(sendResponse);
                break;
            case 'FETCH_CAMPAIGNS':
                await handleFetchCampaigns(sendResponse);
                break;
            case 'FETCH_ROULETTE_AGENTS':
                await handleFetchRouletteAgents(sendResponse);
                break;
            case 'FETCH_STATUSES':
                await handleFetchStatuses(message, sendResponse);
                break;
            case 'SAVE_LEAD':
                await handleSaveLead(message, sendResponse);
                break;
            case 'SYNC_CONTACTS_BATCH':
                await handleSyncContactsBatch(message, sendResponse);
                break;
            case 'SAVE_ATTENDANCE_EVENTS':
                await handleSaveAttendanceEvents(message, sendResponse);
                break;
            case 'FETCH_ATTENDANCE_SUMMARY':
                await handleFetchAttendanceSummary(message, sendResponse);
                break;
            case 'DELETE_ALL_LEADS':
                await handleDeleteAllLeads(message, sendResponse);
                break;
            case 'FETCH_TASKS':
                await handleFetchTasks(message, sendResponse);
                break;
            case 'CREATE_TASK':
                await handleCreateTask(message, sendResponse);
                break;
            case 'UPDATE_TASK':
                await handleUpdateTask(message, sendResponse);
                break;
            case 'DELETE_TASK':
                await handleDeleteTask(message, sendResponse);
                break;

            // TODO: Add CREATE_LEAD, UPDATE_LEAD handlers
            default:
                sendResponse({ error: 'Unknown message type' });
        }
    } catch (error: any) {
        console.error('[IVILLAR CRM] Background Error:', error);
        sendResponse({ error: error.message });
    }
}

async function handlePingAppUrl(message: any, sendResponse: (response: any) => void) {
    const rawUrl = typeof message.url === 'string' ? message.url.trim() : '';
    if (!rawUrl) {
        sendResponse({ ok: false, error: 'missing url' });
        return;
    }
    const baseUrl = rawUrl.split('#')[0];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    try {
        const response = await fetch(baseUrl, { signal: controller.signal });
        sendResponse({ ok: response.ok, status: response.status });
    } catch (error: any) {
        sendResponse({ ok: false, error: error?.message || 'ping failed' });
    } finally {
        clearTimeout(timer);
    }
}

async function handleFetchLead(message: any, sendResponse: (response: any) => void) {
    const settings = await getSettings();
    const baseUrl = await resolveBaseUrl(settings);
    const headers = buildHeaders(settings.token);
    const url = new URL(`${stripTrailingSlash(baseUrl)}/leads`);

    if (message.phone) {
        url.searchParams.set('phone', message.phone);
    }

    if (message.name) {
        url.searchParams.set('name', message.name);
    }

    if (message.ownerId) {
        url.searchParams.set('ownerId', message.ownerId);
    }

    console.log('[CRM BACKGROUND] Fetching lead:', url.toString());
    try {
        const response = await fetch(url.toString(), { headers });

        if (!response.ok) {
            throw new Error(`CRM fetch failed (${response.status})`);
        }

        const payload = await response.json();
        const lead = Array.isArray(payload) ? payload[0] || null : payload;
        sendResponse({ lead });
    } catch (e: any) {
        throw new Error(`${e.message} (URL: ${url.toString()})`);
    }
}

async function handleFetchLeads(message: any, sendResponse: (response: any) => void) {
    const settings = await getSettings();
    const baseUrl = await resolveBaseUrl(settings);
    const headers = buildHeaders(settings.token);
    const url = new URL(`${stripTrailingSlash(baseUrl)}/leads`);

    if (message.query) {
        url.searchParams.set('query', String(message.query));
    }
    if (message.ownerId) {
        url.searchParams.set('ownerId', String(message.ownerId));
    }

    console.log('[CRM BACKGROUND] Fetching leads:', url.toString());
    try {
        const response = await fetch(url.toString(), { headers });

        if (!response.ok) {
            throw new Error(`CRM leads fetch failed (${response.status})`);
        }

        const payload = await response.json();
        const leads = Array.isArray(payload) ? payload : [];
        sendResponse({ leads });
    } catch (e: any) {
        throw new Error(`${e.message} (URL: ${url.toString()})`);
    }
}

async function handleFetchProperties(sendResponse: (response: any) => void) {
    const settings = await getSettings();
    const baseUrl = await resolveBaseUrl(settings);
    const headers = buildHeaders(settings.token);
    const url = `${stripTrailingSlash(baseUrl)}/properties`;

    console.log('[CRM BACKGROUND] Fetching properties:', url);
    const response = await fetch(url, { headers });

    if (!response.ok) {
        throw new Error(`CRM properties fetch failed (${response.status})`);
    }

    const payload = await response.json();
    const properties = Array.isArray(payload) ? payload : [];
    sendResponse({ properties });
}

async function handleFetchCampaigns(sendResponse: (response: any) => void) {
    const settings = await getSettings();
    const baseUrl = await resolveBaseUrl(settings);
    const headers = buildHeaders(settings.token);
    const url = `${stripTrailingSlash(baseUrl)}/email/campaigns`;

    console.log('[CRM BACKGROUND] Fetching campaigns:', url);
    const response = await fetch(url, { headers });

    if (!response.ok) {
        throw new Error(`CRM campaigns fetch failed (${response.status})`);
    }

    const payload = await response.json();
    const campaigns = Array.isArray(payload) ? payload : [];
    sendResponse({ campaigns });
}

async function handleFetchRouletteAgents(sendResponse: (response: any) => void) {
    const settings = await getSettings();
    const baseUrl = await resolveBaseUrl(settings);
    const headers = buildHeaders(settings.token);
    const url = `${stripTrailingSlash(baseUrl)}/lead-roulette/agents`;

    console.log('[CRM BACKGROUND] Fetching roulette agents:', url);
    const response = await fetch(url, { headers });

    if (!response.ok) {
        throw new Error(`CRM agents fetch failed (${response.status})`);
    }

    const payload = await response.json();
    const agents = Array.isArray(payload) ? payload : [];
    sendResponse({ agents });
}

async function handleFetchStatuses(message: any, sendResponse: (response: any) => void) {
    const settings = await getSettings();
    const baseUrl = stripTrailingSlash(await resolveBaseUrl(settings));
    const headers = buildHeaders(settings.token);

    const extractOptions = (payload: any) => {
        const pipelines = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.pipelines)
                ? payload.pipelines
                : Array.isArray(payload?.data)
                    ? payload.data
                    : [];

        const selectedPipeline =
            pipelines.find((pipeline: any) => pipeline?.isDefault) || pipelines[0];

        const stages = Array.isArray(selectedPipeline?.stages)
            ? selectedPipeline.stages
            : Array.isArray(selectedPipeline?.steps)
                ? selectedPipeline.steps
                : Array.isArray(selectedPipeline?.columns)
                    ? selectedPipeline.columns
                    : [];

        const options: { value: string; label: string }[] = [];
        const seen = new Set<string>();

        stages.forEach((stage: any) => {
            const value = String(stage?.id || stage?.status || stage?.key || stage?.title || stage?.name || '');
            const label = String(stage?.title || stage?.name || stage?.label || stage?.id || stage?.status || '');
            if (!value || seen.has(value)) return;
            seen.add(value);
            options.push({ value, label });
        });

        return options;
    };

    let options: { value: string; label: string }[] = [];

    try {
        const pipelinesResponse = await fetch(`${baseUrl}/pipelines`, { headers });
        if (pipelinesResponse.ok) {
            const pipelinePayload = await pipelinesResponse.json().catch(() => null);
            options = extractOptions(pipelinePayload);
        }
    } catch {
        // Ignore and fallback to lead statuses.
    }

    const ownerId = message?.ownerId ? String(message.ownerId) : '';
    const leadUrl = ownerId ? `${baseUrl}/leads?ownerId=${ownerId}` : `${baseUrl}/leads`;
    const leadsResponse = await fetch(leadUrl, { headers });
    if (!leadsResponse.ok) {
        throw new Error(`CRM status fetch failed (${leadsResponse.status})`);
    }

    const payload = await leadsResponse.json();
    const leads = Array.isArray(payload) ? payload : [];
    const statuses = Array.from(
        new Set(
            leads
                .map((lead: any) => String(lead?.status || '').trim())
                .filter((value: string) => value)
        )
    );

    sendResponse({ statuses, options });
}

async function handleSaveLead(message: any, sendResponse: (response: any) => void) {
    const settings = await getSettings();
    const baseUrl = await resolveBaseUrl(settings);
    const headers = buildHeaders(settings.token);
    const leadId = message.leadId;
    const url = leadId
        ? `${stripTrailingSlash(baseUrl)}/leads/${leadId}`
        : `${stripTrailingSlash(baseUrl)}/leads`;
    const method = leadId ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(message.payload || {})
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `CRM save failed (${response.status})`);
    }

    const lead = await response.json().catch(() => null);
    sendResponse({ lead });
}

async function handleSyncContactsBatch(message: any, sendResponse: (response: any) => void) {
    const ownerId = message.ownerId ? String(message.ownerId) : '';
    const leads = Array.isArray(message.leads) ? message.leads : [];
    const mode = message.mode === 'crm' ? 'crm' : 'cache';

    if (!ownerId) {
        sendResponse({ error: 'ownerId required' });
        return;
    }

    const scopedLeads = leads
        .map((lead: any) => ({ ...lead, ownerId: lead?.ownerId ? String(lead.ownerId) : ownerId }))
        .filter((lead: any) => lead.ownerId === ownerId);

    if (!scopedLeads.length) {
        sendResponse({ count: 0 });
        return;
    }

    if (mode !== 'crm') {
        console.log('[CRM BACKGROUND] Contacts sync set to cache-only. Skipping CRM lead creation.');
        sendResponse({ count: scopedLeads.length, mode });
        return;
    }

    const settings = await getSettings();
    const baseUrl = await resolveBaseUrl(settings);
    const headers = buildHeaders(settings.token);

    console.log('[CRM BACKGROUND] Syncing batch:', scopedLeads.length);

    // Naive implementation: loop and save one by one (reusing existing POST)
    // Ideally we should have a bulk endpoint. 
    // If we assume backend can handle parallel requests:

    let savedCount = 0;
    const errors: any[] = [];

    // Process in chunks to avoid browser network limits
    const CHUNK_SIZE = 5;
    for (let i = 0; i < scopedLeads.length; i += CHUNK_SIZE) {
        const chunk = scopedLeads.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (lead: any) => {
            try {
                // Determine if we update or create. 
                // We use POST to leads endpoint, it usually handles upsert if phone matches in many CRMs.
                // Our CRM: POST /leads
                const url = `${stripTrailingSlash(baseUrl)}/leads`;
                const res = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(lead)
                });
                if (res.ok) savedCount++;
                else errors.push({ phone: lead.phone, status: res.status });
            } catch (e) {
                errors.push({ phone: lead.phone, error: String(e) });
            }
        }));
    }

    sendResponse({ count: savedCount });
}

async function handleSaveAttendanceEvents(message: any, sendResponse: (response: any) => void) {
    const settings = await getSettings();
    const baseUrl = await resolveBaseUrl(settings);
    const headers = buildHeaders(settings.token);
    const ownerId = message.ownerId ? String(message.ownerId) : '';
    const events = Array.isArray(message.events) ? message.events : [];

    if (!ownerId || !events.length) {
        sendResponse({ count: 0 });
        return;
    }

    const url = `${stripTrailingSlash(baseUrl)}/attendance/events`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ownerId, events })
        });

        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || `Attendance save failed (${response.status})`);
        }

        const payload = await response.json().catch(() => ({}));
        sendResponse({ count: payload.count || 0 });
    } catch (error: any) {
        sendResponse({ error: error.message || 'Attendance save failed' });
    }
}

async function handleFetchAttendanceSummary(message: any, sendResponse: (response: any) => void) {
    const settings = await getSettings();
    const baseUrl = await resolveBaseUrl(settings);
    const headers = buildHeaders(settings.token);
    const ownerId = message.ownerId ? String(message.ownerId) : '';
    const range = message.range ? String(message.range) : 'today';

    if (!ownerId) {
        sendResponse({ error: 'ownerId required' });
        return;
    }

    const url = new URL(`${stripTrailingSlash(baseUrl)}/attendance/summary`);
    url.searchParams.set('ownerId', ownerId);
    url.searchParams.set('range', range);

    try {
        const response = await fetch(url.toString(), { headers });
        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || `Attendance fetch failed (${response.status})`);
        }
        const payload = await response.json();
        sendResponse({ summary: payload });
    } catch (error: any) {
        sendResponse({ error: error.message || 'Attendance fetch failed' });
    }
}

async function handleDeleteAllLeads(message: any, sendResponse: (response: any) => void) {
    const settings = await getSettings();
    const baseUrl = await resolveBaseUrl(settings);
    const headers = buildHeaders(settings.token);
    const ownerId = message.ownerId;

    if (!ownerId) {
        sendResponse({ error: 'ownerId required' });
        return;
    }

    const url = `${stripTrailingSlash(baseUrl)}/leads?ownerId=${ownerId}`;
    console.log('[CRM BACKGROUND] Deleting all leads for owner:', ownerId);

    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) {
            throw new Error(`Deletion failed (${response.status})`);
        }

        const result = await response.json();
        sendResponse(result);
    } catch (e: any) {
        sendResponse({ error: e.message });
    }
}

async function handleFetchTasks(message: any, sendResponse: (response: any) => void) {
    const settings = await getSettings();
    const baseUrl = await resolveBaseUrl(settings);
    const headers = buildHeaders(settings.token);
    const url = new URL(`${stripTrailingSlash(baseUrl)}/tasks`);

    const params = message?.params || {};
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        url.searchParams.set(String(key), String(value));
    });

    try {
        const response = await fetch(url.toString(), { headers });
        if (!response.ok) {
            throw new Error(`CRM tasks fetch failed (${response.status})`);
        }
        const payload = await response.json();
        const tasks = Array.isArray(payload) ? payload : [];
        sendResponse({ tasks });
    } catch (error: any) {
        sendResponse({ error: error.message || 'Tasks fetch failed' });
    }
}

async function handleCreateTask(message: any, sendResponse: (response: any) => void) {
    const settings = await getSettings();
    const baseUrl = await resolveBaseUrl(settings);
    const headers = buildHeaders(settings.token);
    const payload = message?.payload || {};

    try {
        const response = await fetch(`${stripTrailingSlash(baseUrl)}/tasks`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || `CRM task create failed (${response.status})`);
        }
        const task = await response.json().catch(() => null);
        sendResponse({ task });
    } catch (error: any) {
        sendResponse({ error: error.message || 'Task create failed' });
    }
}

async function handleUpdateTask(message: any, sendResponse: (response: any) => void) {
    const settings = await getSettings();
    const baseUrl = await resolveBaseUrl(settings);
    const headers = buildHeaders(settings.token);
    const taskId = message?.id ? String(message.id) : '';
    const payload = message?.payload || {};

    if (!taskId) {
        sendResponse({ error: 'task id required' });
        return;
    }

    try {
        const response = await fetch(`${stripTrailingSlash(baseUrl)}/tasks/${taskId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || `CRM task update failed (${response.status})`);
        }
        const task = await response.json().catch(() => null);
        sendResponse({ task });
    } catch (error: any) {
        sendResponse({ error: error.message || 'Task update failed' });
    }
}

async function handleDeleteTask(message: any, sendResponse: (response: any) => void) {
    const settings = await getSettings();
    const baseUrl = await resolveBaseUrl(settings);
    const headers = buildHeaders(settings.token);
    const taskId = message?.id ? String(message.id) : '';

    if (!taskId) {
        sendResponse({ error: 'task id required' });
        return;
    }

    try {
        const response = await fetch(`${stripTrailingSlash(baseUrl)}/tasks/${taskId}`, {
            method: 'DELETE',
            headers
        });
        if (!response.ok && response.status !== 204) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || `CRM task delete failed (${response.status})`);
        }
        sendResponse({ success: true });
    } catch (error: any) {
        sendResponse({ error: error.message || 'Task delete failed' });
    }
}


async function getSettings() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEY] || {}) };
}

const isLocalhost = (hostname: string) =>
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

const pingBaseUrl = async (baseUrl: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    try {
        const res = await fetch(`${stripTrailingSlash(baseUrl)}/${HEALTH_PATH}`, { signal: controller.signal });
        if (!res.ok) return false;
        const data = await res.json().catch(() => null);
        return data?.status === 'ok';
    } catch {
        return false;
    } finally {
        clearTimeout(timer);
    }
};

async function resolveBaseUrl(settings: { baseUrl: string }) {
    const baseUrl = stripTrailingSlash(settings.baseUrl || DEFAULT_BASE_URL);
    if (cachedBaseUrl && Date.now() - cachedAt < RESOLVE_TTL_MS) {
        return cachedBaseUrl;
    }

    if (await pingBaseUrl(baseUrl)) {
        cachedBaseUrl = baseUrl;
        cachedAt = Date.now();
        return baseUrl;
    }

    try {
        const url = new URL(baseUrl);
        if (!isLocalhost(url.hostname)) {
            return baseUrl;
        }
        const path = url.pathname.replace(/\/$/, '') || '/api';
        for (let port = 3001; port <= 3006; port += 1) {
            const candidate = `${url.protocol}//${url.hostname}:${port}${path}`;
            if (candidate === baseUrl) continue;
            if (await pingBaseUrl(candidate)) {
                cachedBaseUrl = candidate;
                cachedAt = Date.now();
                await chrome.storage.local.set({
                    [STORAGE_KEY]: { ...settings, baseUrl: candidate }
                });
                return candidate;
            }
        }
    } catch {
        // Keep default baseUrl on parse errors.
    }

    return baseUrl;
}

function stripTrailingSlash(value: string) {
    return value.endsWith('/') ? value.slice(0, -1) : value;
}

function buildHeaders(token?: string) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return headers;
}
