import { Request, Response } from 'express';
import { whatsappService } from '../services/whatsappService';

export const getStatus = (_req: Request, res: Response) => {
    const status = whatsappService.getStatus();
    res.json({ status, isReady: status === 'ready' });
};

export const getChats = async (_req: Request, res: Response) => {
    const chats = whatsappService.getChats();
    res.json(chats);
};

export const getMessages = async (req: Request, res: Response) => {
    const { chatId } = req.params;
    if (!chatId) return res.status(400).json({ error: 'Chat ID required' });
    // chatId vem como query param URL-encoded (ex: "5511...@s.whatsapp.net")
    const jid = decodeURIComponent(chatId);
    whatsappService.markAsRead(jid);
    res.json(whatsappService.getChatMessages(jid));
};

export const sendMessage = async (req: Request, res: Response) => {
    const { phoneNumber, message } = req.body;
    if (!phoneNumber || !message) {
        return res.status(400).json({ error: 'Número de telefone e mensagem são obrigatórios' });
    }

    const status = whatsappService.getStatus();
    if (status !== 'ready') {
        return res.status(503).json({
            error: 'WhatsApp não está conectado. Acesse WhatsApp Marketing para escanear o QR Code.',
            status
        });
    }

    const success = await whatsappService.sendTextMessage(phoneNumber, message);
    if (success) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Falha ao enviar mensagem' });
    }
};
