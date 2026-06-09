import { ApiClient } from './api';
import { Lead, LeadStatus } from '../types';
import { API_BASE_URL } from './apiConfig';

// Decode userId from stored JWT token
function getStoredUserId(): string | null {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || null;
    } catch {
        return null;
    }
}

export const leadService = {
    getAll: async (): Promise<Lead[]> => {
        const userId = getStoredUserId();
        // The API requires ?ownerId or ?phone to avoid returning everyone's data
        const params = userId ? `?ownerId=${encodeURIComponent(userId)}` : '';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/leads${params}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return [];
        return res.json();
    },

    create: async (lead: Partial<Lead>): Promise<Lead> => {
        // Auto-assign to current user if no ownerId set
        const userId = getStoredUserId();
        const payload = { ...lead };
        if (!payload.ownerId && userId) payload.ownerId = userId as any;
        if (!payload.assignedTo && userId) payload.assignedTo = userId as any;
        return ApiClient.post<Lead>('/leads', payload);
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

    importLeads: async (_leads: any[]) => {
        return true;
    }
};
