import { ApiClient } from './api';
import { Lead, LeadStatus } from '../types';
import { API_BASE_URL } from './apiConfig';

interface JWTPayload { userId: string; role: string; }

function getTokenPayload(): JWTPayload | null {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        return JSON.parse(atob(token.split('.')[1])) as JWTPayload;
    } catch {
        return null;
    }
}

export const leadService = {
    getAll: async (): Promise<Lead[]> => {
        const payload = getTokenPayload();
        const token = localStorage.getItem('token');

        // super_admin and admin see ALL leads (no ownerId filter needed)
        const isSuperUser = payload?.role === 'super_admin' || payload?.role === 'admin';
        const params = (!isSuperUser && payload?.userId)
            ? `?ownerId=${encodeURIComponent(payload.userId)}`
            : '';

        const res = await fetch(`${API_BASE_URL}/leads${params}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return [];
        return res.json();
    },

    create: async (lead: Partial<Lead>): Promise<Lead> => {
        const payload = getTokenPayload();
        const data = { ...lead };
        if (!data.ownerId && payload?.userId) data.ownerId = payload.userId as any;
        if (!data.assignedTo && payload?.userId) data.assignedTo = payload.userId as any;
        return ApiClient.post<Lead>('/leads', data);
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
