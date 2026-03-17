import { WhatsAppChat } from '../types';
import { WHATSAPP_API_URL } from './apiConfig';

export const whatsappService = {
    getChats: async (): Promise<WhatsAppChat[]> => {
        try {
            const res = await fetch(`${WHATSAPP_API_URL}/chats`);
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    },

    getMessages: async (chatId: string) => {
        try {
            const res = await fetch(`${WHATSAPP_API_URL}/messages/${chatId}`);
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    },

    sendMessage: async (phoneNumber: string, message: string): Promise<boolean> => {
        try {
            const res = await fetch(`${WHATSAPP_API_URL}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber, message })
            });
            return res.ok;
        } catch (e) {
            console.error(e);
            return false;
        }
    },

    getStatus: async (): Promise<{ isReady: boolean }> => {
        try {
            const res = await fetch(`${WHATSAPP_API_URL}/status`);
            return await res.json();
        } catch (e) {
            return { isReady: false };
        }
    }
};
