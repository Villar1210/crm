import { ApiClient } from './api';
import { User } from '../types';

export const authService = {
    login: async (email: string, password: string): Promise<User> => {
        const response = await ApiClient.post<{ token: string; user: User }>('/auth/login', { email, password }, false);

        // Persist session
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        return response.user;
    },

    register: async (data: Partial<User>) => {
        return ApiClient.post<{ id: string }>('/auth/register', data, false);
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    getCurrentUser: (): User | null => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    }
};
