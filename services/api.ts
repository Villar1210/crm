import { User, Lead, LeadStatus, Property, CRMSettings, HeroSlide, AdCampaign, AdsDashboardStats, Campaign, Pipeline } from '../types';
import { SignatureEnvelope, SignatureSettings, SignatureSummary, SignatureTemplate } from '../types/signature';
import { MOCK_HERO_SLIDES, MOCK_JOBS } from '../constants';
import { API_BASE_URL, API_ROOT_URL } from './apiConfig';

type FetchOptions = RequestInit & {
  authenticated?: boolean;
};

export class ApiClient {
  private static getToken() {
    return localStorage.getItem('token');
  }

  static async request<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { authenticated = true, headers, body, ...rest } = options;

    const defaultHeaders: HeadersInit = {};
    if (!(body instanceof FormData)) {
      (defaultHeaders as any)['Content-Type'] = 'application/json';
    }

    if (authenticated) {
      const token = this.getToken();
      if (token) {
        (defaultHeaders as any)['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { ...defaultHeaders, ...headers },
      body,
      ...rest,
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('novamorada_user');
        // If we are mostly a SPA, we might want to redirect or reload
        // window.location.href = '/#/buyer/login'; 
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.statusText}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  static get<T = any>(endpoint: string, authenticated = true) {
    return this.request<T>(endpoint, { method: 'GET', authenticated });
  }

  static post<T = any>(endpoint: string, body: any, authenticated = true) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      authenticated,
    });
  }

  static put<T = any>(endpoint: string, body: any, authenticated = true) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      authenticated,
    });
  }

  static delete<T = any>(endpoint: string, authenticated = true) {
    return this.request<T>(endpoint, { method: 'DELETE', authenticated });
  }
}

// Adapter to maintain compatibility with existing components
export const api = {
  auth: {
    login: async (email: string, password?: string): Promise<User> => {
      // Old simulation accepted only email, new one needs password.
      // If password is missing (legacy calls), we might fail or use a default if dev.
      const effectivePassword = password || '123456';
      const response = await ApiClient.post<{ token: string; user: User }>('/auth/login', { email, password: effectivePassword }, false);
      localStorage.setItem('token', response.token);
      localStorage.setItem('novamorada_user', JSON.stringify(response.user)); // Keep old key for compatibility if needed, or migrate
      return response.user;
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('novamorada_user');
    },
    getCurrentUser: (): User | null => {
      const stored = localStorage.getItem('novamorada_user');
      return stored ? JSON.parse(stored) : null;
    },
    register: async (data: any) => {
      return ApiClient.post('/auth/register', data, false);
    }
  },
  content: {
    getHeroSlides: async (): Promise<HeroSlide[]> => MOCK_HERO_SLIDES,
    updateHeroSlide: async (_slide: HeroSlide) => true,
  },
  users: {
    getAll: async () => [],
    delete: async (_id: string) => true
  },
  user: {
    getFavorites: async (_userId?: string) => []
  },
  dashboard: {
    getStats: async () => {
      // Connect to real backend stats
      return ApiClient.get('/dashboard/stats');
    }
  },
  properties: {
    getAll: async (options?: { includeUnpublished?: boolean }) => {
      const props = await ApiClient.get<Property[]>('/properties');
      if (options?.includeUnpublished) return props;
      return props.filter(p => p.published !== false);
    },
    getById: async (id: string) => {
      // Inefficient but compatible without backend getById endpoint change
      const props = await ApiClient.get<Property[]>('/properties');
      return props.find(p => p.id === id);
    },
    create: async (data: Partial<Property>) => {
      return ApiClient.post<Property>('/properties', data);
    },
    update: async (id: string, data: Partial<Property>) => {
      return ApiClient.put<Property>(`/properties/${id}`, data);
    },
    delete: async (id: string) => {
      await ApiClient.delete(`/properties/${id}`);
      return true;
    }
  },
  tasks: {
    list: async (params?: any) => {
      const query = new URLSearchParams(params).toString();
      return ApiClient.get(`/tasks?${query}`);
    },
    create: async (data: any) => ApiClient.post('/tasks', data),
    update: async (id: string, data: any) => ApiClient.put(`/tasks/${id}`, data),
    delete: async (id: string) => ApiClient.delete(`/tasks/${id}`)
  },
  leads: {
    getAll: async () => {
      const leads = await ApiClient.get<Lead[]>('/leads');
      return leads;
    },
    create: async (lead: Partial<Lead>) => {
      return ApiClient.post<Lead>('/leads', lead);
    },
    updateStatus: async (id: string, status: LeadStatus) => {
      await ApiClient.put(`/leads/${id}`, { status });
      return true;
    },
    uploadDocument: async (leadId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return ApiClient.post<any>(`/leads/${leadId}/documents`, formData);
    }
  },
  pipelines: {
    getAll: async (): Promise<{ pipelines: Pipeline[] }> => {
      return ApiClient.get('/pipelines');
    },
    save: async (pipelines: Pipeline[]) => {
      return ApiClient.put('/pipelines', { pipelines });
    }
  },
  leadRoulette: {
    getSettings: async () => {
      return ApiClient.get('/lead-roulette/settings');
    },
    updateSettings: async (data: any) => {
      return ApiClient.put('/lead-roulette/settings', data);
    },
    getRules: async () => {
      return ApiClient.get('/lead-roulette/rules');
    },
    createRule: async (data: any) => {
      return ApiClient.post('/lead-roulette/rules', data);
    },
    updateRule: async (id: string, data: any) => {
      return ApiClient.put(`/lead-roulette/rules/${id}`, data);
    },
    deleteRule: async (id: string) => {
      return ApiClient.delete(`/lead-roulette/rules/${id}`);
    },
    getAgents: async () => {
      return ApiClient.get('/lead-roulette/agents');
    },
    updateAgent: async (id: string, data: any) => {
      return ApiClient.put(`/lead-roulette/agents/${id}`, data);
    },
    resetAgentDay: async (id: string) => {
      return ApiClient.post(`/lead-roulette/agents/${id}/reset`, {});
    },
    getLogs: async () => {
      return ApiClient.get('/lead-roulette/logs');
    },
    simulate: async (data: any) => {
      return ApiClient.post('/lead-roulette/simulate', data);
    }
  },
  campaigns: {
    getAll: async () => {
      const response = await ApiClient.get<Campaign[]>('/campaigns');
      return response.map(c => ({
        ...c,
        // Ensure property has correct values if needed, mainly date conversions usually handled by JSON.parse
        startDate: c.startDate.split('T')[0], // Basic format for UI if needed, but keeping ISO is usually better.
        // Let's keep it clean
      }));
    },
    getById: async (id: string) => ApiClient.get<Campaign>(`/campaigns/${id}`),
    create: async (data: any) => ApiClient.post<Campaign>('/campaigns', data),
    update: async (id: string, data: any) => ApiClient.put<Campaign>(`/campaigns/${id}`, data),
    delete: async (id: string) => ApiClient.delete(`/campaigns/${id}`)
  },
  jobs: {
    getAll: async () => MOCK_JOBS,
    apply: async () => true
  },
  crm: {
    getSettings: async (): Promise<CRMSettings> => {
      // Keep local storage for settings for now
      const stored = localStorage.getItem('ivillar_crm_settings');
      const defaults: CRMSettings = {
        allowDefaultPipelineDeletion: false,
        enableProfileMaster: true,
        enableProfileWA: false,
        enableProfileSF: false,
        enableProfilePD: false,
        enableProfileRD: false,
        defaultProfile: 'MASTER',
        whatsappIntegrationMode: 'platform',
        enableAutomations: false,
        automationStagnancyDays: 3
      };
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    },
    updateSettings: async (settings: CRMSettings) => {
      localStorage.setItem('ivillar_crm_settings', JSON.stringify(settings));
      return true;
    }
  },
  email: {
    getDashboardStats: async (period: string = '30') => {
      return ApiClient.get(`/email/metrics/dashboard?days=${period}`);
    },
    getCampaigns: async (filters?: any) => {
      const query = new URLSearchParams(filters).toString();
      return ApiClient.get(`/email/campaigns?${query}`);
    },
    getCampaignById: async (id: string) => {
      return ApiClient.get(`/email/campaigns/${id}`);
    },
    createCampaign: async (data: any) => {
      return ApiClient.post('/email/campaigns', data);
    },
    updateCampaign: async (id: string, data: any) => {
      return ApiClient.put(`/email/campaigns/${id}`, data);
    },
    deleteCampaign: async (id: string) => {
      return ApiClient.delete(`/email/campaigns/${id}`);
    },
    duplicateCampaign: async (id: string) => {
      return ApiClient.post(`/email/campaigns/${id}/duplicate`, {});
    },
    sendCampaign: async (id: string, data: { scheduledAt?: string, testEmail?: string } = {}) => {
      return ApiClient.post(`/email/campaigns/${id}/send`, data);
    },
    pauseCampaign: async (id: string) => {
      return ApiClient.post(`/email/campaigns/${id}/pause`, {});
    },
    getCampaignMetrics: async (id: string) => {
      return ApiClient.get(`/email/campaigns/${id}/metrics`);
    },
    getLists: async () => {
      return ApiClient.get('/email/lists');
    },
    getTemplates: async () => {
      return ApiClient.get('/email/templates');
    }
  },
  realEstate: {
    persons: {
      list: async (params?: { type?: string; search?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return ApiClient.get(`/real-estate/persons?${query}`);
      },
      create: async (data: any) => ApiClient.post('/real-estate/persons', data),
      getById: async (id: string) => ApiClient.get(`/real-estate/persons/${id}`),
      update: async (id: string, data: any) => ApiClient.put(`/real-estate/persons/${id}`, data),
      delete: async (id: string) => ApiClient.delete(`/real-estate/persons/${id}`)
    },
    contracts: {
      list: async (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return ApiClient.get(`/real-estate/contracts?${query}`);
      },
      create: async (data: any) => ApiClient.post('/real-estate/contracts', data),
      getById: async (id: string) => ApiClient.get(`/real-estate/contracts/${id}`),
      update: async (id: string, data: any) => ApiClient.put(`/real-estate/contracts/${id}`, data),
      activate: async (id: string) => ApiClient.post(`/real-estate/contracts/${id}/activate`, {})
    },
    finance: {
      listInvoices: async (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return ApiClient.get(`/real-estate/invoices?${query}`);
      },
      payInvoice: async (id: string, data: any) => ApiClient.post(`/real-estate/invoices/${id}/pay`, data),
      createInvoice: async (data: any) => ApiClient.post('/real-estate/invoices', data),
      listPayouts: async (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return ApiClient.get(`/real-estate/payouts?${query}`);
      }
    },
    maintenance: {
      list: async (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return ApiClient.get(`/real-estate/tickets?${query}`);
      },
      create: async (data: any) => ApiClient.post('/real-estate/tickets', data),
      update: async (id: string, data: any) => ApiClient.put(`/real-estate/tickets/${id}`, data)
    },
    inspections: {
      list: async (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return ApiClient.get(`/real-estate/inspections?${query}`);
      },
      create: async (data: any) => ApiClient.post('/real-estate/inspections', data)
    }
  },

  signatures: {
    getSummary: async (): Promise<SignatureSummary> => {
      return ApiClient.get('/signatures/reports/summary');
    },
    listEnvelopes: async (params?: { status?: string; search?: string }): Promise<SignatureEnvelope[]> => {
      const query = params ? new URLSearchParams(params as any).toString() : '';
      return ApiClient.get(`/signatures/envelopes${query ? `?${query}` : ''}`);
    },
    getEnvelope: async (id: string): Promise<SignatureEnvelope> => {
      return ApiClient.get(`/signatures/envelopes/${id}`);
    },
    createEnvelope: async (data: { title: string; message?: string; createdById?: string; tenantId?: string }) => {
      return ApiClient.post('/signatures/envelopes', data);
    },
    updateEnvelope: async (id: string, data: any) => {
      return ApiClient.put(`/signatures/envelopes/${id}`, data);
    },
    uploadDocuments: async (id: string, files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/signatures/envelopes/${id}/documents`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    addRecipients: async (id: string, recipients: any[]) => {
      return ApiClient.post(`/signatures/envelopes/${id}/recipients`, recipients);
    },
    updateRecipient: async (id: string, data: any) => {
      return ApiClient.put(`/signatures/recipients/${id}`, data);
    },
    deleteRecipient: async (id: string) => {
      return ApiClient.delete(`/signatures/recipients/${id}`);
    },
    addFields: async (id: string, fields: any[]) => {
      return ApiClient.post(`/signatures/envelopes/${id}/fields`, fields);
    },
    updateField: async (id: string, data: any) => {
      return ApiClient.put(`/signatures/fields/${id}`, data);
    },
    deleteField: async (id: string) => {
      return ApiClient.delete(`/signatures/fields/${id}`);
    },
    sendEnvelope: async (id: string) => {
      return ApiClient.post(`/signatures/envelopes/${id}/send`, {});
    },
    downloadEnvelope: (id: string) => {
      return `${API_ROOT_URL}/api/signatures/envelopes/${id}/download`;
    },
    getSignSession: async (token: string) => {
      return ApiClient.get(`/signatures/sign/${token}`, false);
    },
    markViewed: async (token: string) => {
      return ApiClient.post(`/signatures/sign/${token}/view`, {}, false);
    },
    completeSigning: async (token: string, payload: any) => {
      return ApiClient.post(`/signatures/sign/${token}/complete`, payload, false);
    },
    listTasks: async () => {
      return ApiClient.get('/signatures/tasks');
    },
    listTemplates: async (): Promise<SignatureTemplate[]> => {
      return ApiClient.get('/signatures/templates');
    },
    createTemplate: async (data: any) => {
      return ApiClient.post('/signatures/templates', data);
    },
    updateTemplate: async (id: string, data: any) => {
      return ApiClient.put(`/signatures/templates/${id}`, data);
    },
    deleteTemplate: async (id: string) => {
      return ApiClient.delete(`/signatures/templates/${id}`);
    },
    getSettings: async (): Promise<SignatureSettings> => {
      return ApiClient.get('/signatures/settings');
    },
    updateSettings: async (data: any) => {
      return ApiClient.put('/signatures/settings', data);
    }
  },

  pdf: {
    merge: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      // Use raw fetch or ApiClient with blob response handling? ApiClient.post returns JSON by default.
      // We need blob. Let's use ApiClient but we might need to adjust it or direct fetch.
      // ApiClient handles JSON parsing. For Blob, we might need a custom method or bypass.
      // Let's bypass for now or add blob support to ApiClient?
      // Simplest: direct fetch with Auth header.
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/merge`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('Merge failed');
      return response.blob();
    },
    split: async (file: File, ranges: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ranges', ranges);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/split`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('Split failed');
      return response.blob();
    },
    imagesToPdf: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/images-to-pdf`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('Conversion failed');
      return response.blob();
    },
    rotate: async (file: File, angle: 90 | 180 | 270) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('angle', angle.toString());
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/rotate`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('Rotate failed');
      return response.blob();
    },
    protect: async (file: File, password: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/protect`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('Protection failed');
      return response.blob();
    },
    unlock: async (file: File, password?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (password) formData.append('password', password);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/unlock`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('Unlock failed');
      return response.blob();
    },
    deletePages: async (file: File, pages: string) => { // "1,2,5-7"
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pages', pages);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/delete-pages`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('Delete pages failed');
      return response.blob();
    },
    watermark: async (file: File, text: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('text', text);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/watermark`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('Watermark failed');
      return response.blob();
    },
    pageNumbers: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/page-numbers`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('Helper failed');
      return response.blob();
    },
    sign: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/sign`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('Sign failed');
      return response.blob();
    },
    // New Tools
    compress: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/compress`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('Compression failed');
      return response.blob();
    },
    repair: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/repair`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('Repair failed');
      return response.blob();
    },
    ocr: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/ocr`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('OCR failed');
      return response.blob();
    },
    // Office -> PDF
    wordToPdf: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/word-to-pdf`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('Word to PDF failed');
      return response.blob();
    },
    excelToPdf: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/excel-to-pdf`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('Excel to PDF failed');
      return response.blob();
    },
    pptToPdf: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/ppt-to-pdf`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('PPT to PDF failed');
      return response.blob();
    },
    // PDF -> Office
    pdfToWord: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/pdf-to-word`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('PDF to Word failed');
      return response.blob();
    },
    pdfToExcel: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/pdf-to-excel`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('PDF to Excel failed');
      return response.blob();
    },
    pdfToPpt: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/pdf-to-ppt`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('PDF to PPT failed');
      return response.blob();
    },
    // Images
    pdfToJpg: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/pdf/pdf-to-jpg`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!response.ok) throw new Error('PDF to JPG failed');
      return response.blob();
    }
  },

  system: {
    resetDatabase: async (password: string, type: 'production' | 'development') => {
      return ApiClient.post('/system/reset-database', { password, type });
    }
  }
};

// Keep exports for Ads
export async function fetchAdsDashboardStats(): Promise<AdsDashboardStats> {
  return {
    totalInvestment: 0,
    totalReach: 0,
    totalClicks: 0,
    activeCampaigns: 0,
  };
}

export async function fetchAdCampaigns(): Promise<AdCampaign[]> {
  return [];
}

export async function createAdCampaign(_payload: any): Promise<AdCampaign> {
  throw new Error("Not implemented");
}

export async function boostExistingCampaign(_id: string, _changes: any): Promise<AdCampaign> {
  throw new Error("Not implemented");
}
