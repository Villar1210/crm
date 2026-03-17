import { Request, Response } from 'express';
import { whatsappService } from '../services/whatsappService';

export const getStatus = async (_req: Request, res: Response) => {
    const status = whatsappService.getStatus();
    res.json(status);
};

export const getChats = async (_req: Request, res: Response) => {
    const chats = await whatsappService.getChats();
    res.json(chats);
};

export const getMessages = async (req: Request, res: Response) => {
    const { chatId } = req.params;
    if (!chatId) return res.status(400).json({ error: 'Chat ID required' });
    const messages = await whatsappService.getChatMessages(chatId);
    res.json(messages);
};

export const sendMessage = async (req: Request, res: Response) => {
    const { phoneNumber, message } = req.body;
    if (!phoneNumber || !message) {
        return res.status(400).json({ error: 'Missing phone number or message' });
    }

    const success = await whatsappService.sendMessage(phoneNumber, message);
    if (success) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Failed to send message' });
    }
};
