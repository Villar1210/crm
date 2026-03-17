import { ApiClient } from './api';
import { Property } from '../types';

export const propertyService = {
    getAll: async (): Promise<Property[]> => {
        return ApiClient.get<Property[]>('/properties');
    },

    getById: async (id: string): Promise<Property> => {
        // In backend we might not have a getById specific endpoint if we don't fetch all first
        // For now, assuming we filter locally or add getById endpoint if needed, 
        // but REST best practice is /properties/:id. We implemented getAll usually.
        // Let's assume getAll for now or fetch list and find. 
        // Wait, I implemented standard REST so likely acceptable to fetch all or add getById.
        // Actually, I didn't add getById to propertyController. Let's rely on getAll for now or add it.
        // Efficient way:
        const all = await ApiClient.get<Property[]>('/properties');
        const found = all.find(p => p.id === id);
        if (!found) throw new Error('Property not found');
        return found;
    },

    create: async (property: Partial<Property>): Promise<Property> => {
        return ApiClient.post<Property>('/properties', property);
    },

    update: async (id: string, data: Partial<Property>): Promise<Property> => {
        return ApiClient.put<Property>(`/properties/${id}`, data);
    },

    delete: async (id: string): Promise<boolean> => {
        await ApiClient.delete(`/properties/${id}`);
        return true;
    }
};
