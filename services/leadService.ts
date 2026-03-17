import { ApiClient } from './api';
import { Lead, LeadStatus } from '../types';

export const leadService = {
    getAll: async (): Promise<Lead[]> => {
        return ApiClient.get<Lead[]>('/leads');
    },

    create: async (lead: Partial<Lead>): Promise<Lead> => {
        return ApiClient.post<Lead>('/leads', lead);
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
