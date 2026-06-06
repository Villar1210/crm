import { ApiClient } from './api';
import { Lead, LeadStatus } from '../types';

const getCurrentUserId = (): string | null => {
    try {
        const stored = localStorage.getItem('user') || localStorage.getItem('novamorada_user');
        if (!stored) return null;
        const user = JSON.parse(stored);
        return user?.id || null;
    } catch {
        return null;
    }
};

export const leadService = {
    getAll: async (): Promise<Lead[]> => {
        const ownerId = getCurrentUserId();
        const query = ownerId ? `?ownerId=${ownerId}` : '';
        return ApiClient.get<Lead[]>(`/leads${query}`);
    },

    create: async (lead: Partial<Lead>): Promise<Lead> => {
        const ownerId = getCurrentUserId();
        return ApiClient.post<Lead>('/leads', { ...lead, ownerId: lead.ownerId || ownerId });
    },

    update: async (id: string, data: Partial<Lead>): Promise<Lead> => {
        return ApiClient.put<Lead>(`/leads/${id}`, data);
    },

    updateStatus: async (id: string, status: LeadStatus): Promise<boolean> => {
        await ApiClient.put(`/leads/${id}`, { status });
        return true;
    },

    delete: async (id: string): Promise<void> => {
        return ApiClient.delete(`/leads/${id}`);
    },

    // Method legacy for compatibility, can be removed later or adapted
    importLeads: async (_leads: any[]) => {
        // Setup bulk import endpoint later
        return true;
    }
};
