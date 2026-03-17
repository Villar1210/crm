import { Client, LocalAuth } from 'whatsapp-web.js';
import { Server } from 'socket.io';
import fs from 'fs';

const resolveBrowserExecutable = () => {
    const envCandidates = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        process.env.CHROME_PATH,
        process.env.GOOGLE_CHROME_SHIM,
    ].filter(Boolean) as string[];

    const programFiles = process.env.PROGRAMFILES || '';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || '';
    const localAppData = process.env.LOCALAPPDATA || '';

    const windowsCandidates = [
        `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
        `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
        `${localAppData}\\Google\\Chrome\\Application\\chrome.exe`,
        `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
        `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`,
        `${localAppData}\\Microsoft\\Edge\\Application\\msedge.exe`,
    ];

    for (const candidate of [...envCandidates, ...windowsCandidates]) {
        if (candidate && fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return '';
};

let io: Server;
let client: Client;
let qrCodeUrl: string = '';
let isReady = false;
let lastError: string | null = null;

const emitError = (message: string) => {
    lastError = message;
    if (io) {
        io.emit('whatsapp_error', { message });
    }
};

export const whatsappService = {
    initialize: (socketIo: Server, forceReset = false) => {
        console.log('Initializing WhatsApp Client...');
        io = socketIo;
        lastError = null;

        const authPath = './whatsapp-auth';

        if (forceReset) {
            console.log('Performing Hard Reset: Deleting Session...');
            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
            }
        }

        const executablePath = resolveBrowserExecutable();
        if (!executablePath) {
            const message = 'Browser executable not found. Install Chrome/Edge or set PUPPETEER_EXECUTABLE_PATH.';
            console.warn(`[WhatsApp] ${message}`);
            emitError(message);
            return;
        }
        const puppeteerConfig = {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--disable-gpu'
            ],
            headless: true,
            timeout: 60000,
            executablePath,
        };

        client = new Client({
            authStrategy: new LocalAuth({ dataPath: './whatsapp-auth' }),
            puppeteer: puppeteerConfig,
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
            }
        });

        client.on('qr', (qr) => {
            console.log('QR Code received');
            qrCodeUrl = qr;
            io.emit('whatsapp_qr', qr);
        });

        client.on('ready', () => {
            console.log('Client is ready!');
            isReady = true;
            qrCodeUrl = '';
            lastError = null;
            io.emit('whatsapp_ready');
        });

        client.on('authenticated', () => {
            console.log('Client authenticated');
            io.emit('whatsapp_authenticated');
        });

        client.on('auth_failure', async (msg) => {
            console.error('AUTHENTICATION FAILURE', msg);
            console.log('Triggering Auto-Reset...');
            await whatsappService.logout();
            whatsappService.initialize(io, true); // Recursive reset
        });

        client.on('message', async (msg) => {
            console.log('MESSAGE RECEIVED', msg.body);
            io.emit('whatsapp_message', {
                id: msg.id.id,
                from: msg.from,
                body: msg.body,
                timestamp: msg.timestamp,
                hasMedia: msg.hasMedia
            });
        });

        client.initialize().catch((error) => {
            console.error('WhatsApp client failed to initialize:', error);
            const message = error instanceof Error ? error.message : 'WhatsApp client failed to initialize.';
            emitError(message);
        });
    },

    attachSocketID: (socketIo: Server) => {
        whatsappService.initialize(socketIo);
    },

    getChats: async () => {
        if (!isReady) return [];
        const maxRetries = 3;
        for (let i = 0; i < maxRetries; i++) {
            try {
                const chats = await client.getChats();
                return chats.map(chat => ({
                    id: chat.id._serialized,
                    name: chat.name,
                    unreadCount: chat.unreadCount,
                    lastMessage: chat.lastMessage?.body || '',
                    lastMessageTime: chat.timestamp ? new Date(chat.timestamp * 1000).toISOString() : new Date().toISOString(),
                    phoneNumber: chat.id.user,
                    isGroup: chat.isGroup,
                }));
            } catch (error) {
                console.warn(`Attempt ${i + 1} to fetch chats failed:`, error);
                if (i === maxRetries - 1) {
                    console.error('Final failure fetching chats:', error);
                    return [];
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        return [];
    },

    getChatMessages: async (chatId: string) => {
        if (!isReady) return [];
        try {
            const chat = await client.getChatById(chatId);
            const messages = await chat.fetchMessages({ limit: 50 });
            return messages.map(msg => ({
                id: msg.id.id,
                from: msg.from,
                body: msg.body,
                timestamp: msg.timestamp * 1000,
                hasMedia: msg.hasMedia,
                sender: msg.fromMe ? 'user' : 'agent'
            }));
        } catch (error) {
            console.error(`Error fetching messages for ${chatId}:`, error);
            return [];
        }
    },

    sendMessage: async (phoneNumber: string, message: string) => {
        if (!isReady) return false;
        try {
            const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@c.us`;
            await client.sendMessage(chatId, message);
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    },

    logout: async () => {
        if (client) {
            await client.logout();
            isReady = false;
            qrCodeUrl = '';
        }
    },

    getStatus: () => {
        return { isReady, qr: qrCodeUrl, error: lastError };
    },

    resetSession: async () => {
        console.log('Manual Reset Requested');
        if (client) {
            try { await client.destroy(); } catch (e) { console.error('Error destroying client:', e); }
        }
        whatsappService.initialize(io, true);
        return true;
    }
};
