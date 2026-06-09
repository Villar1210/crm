import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

type WAStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'authenticated' | 'ready';

export const useWhatsApp = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [qr, setQr] = useState<string>('');
    const [status, setStatus] = useState<'disconnected' | 'connected' | 'restoring'>('disconnected');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin;
        const newSocket = io(wsUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            timeout: 20000,
        });

        newSocket.on('connect', () => {
            console.log('[WA Hook] Socket connected');
            setStatus('connected');
        });

        newSocket.on('disconnect', () => {
            console.log('[WA Hook] Socket disconnected');
            setStatus('disconnected');
            setIsReady(false);
        });

        // ── Sincroniza o estado atual quando o browser conecta ────────────────
        newSocket.on('whatsapp_status', (serverStatus: WAStatus) => {
            console.log('[WA Hook] Status recebido:', serverStatus);
            switch (serverStatus) {
                case 'ready':
                    setQr('');
                    setIsReady(true);
                    setStatus('connected');
                    break;
                case 'authenticated':
                    setQr('');
                    setIsReady(false);
                    setStatus('restoring');
                    break;
                case 'qr_ready':
                    // QR será recebido via whatsapp_qr logo em seguida
                    setIsReady(false);
                    setStatus('connected');
                    break;
                case 'connecting':
                    setIsReady(false);
                    setStatus('connected'); // socket ok, wa ainda conectando
                    break;
                case 'disconnected':
                default:
                    setQr('');
                    setIsReady(false);
                    setStatus('disconnected');
                    break;
            }
        });

        // ── Eventos do ciclo de vida do WhatsApp ──────────────────────────────
        newSocket.on('whatsapp_qr', (qrCode: string) => {
            console.log('[WA Hook] QR recebido');
            setQr(qrCode);
            setIsReady(false);
            setStatus('connected');
        });

        newSocket.on('whatsapp_authenticated', () => {
            console.log('[WA Hook] Autenticado');
            setQr('');
            setIsReady(false);
            setStatus('restoring');
        });

        newSocket.on('whatsapp_ready', () => {
            console.log('[WA Hook] Pronto!');
            setQr('');
            setIsReady(true);
            setStatus('connected');
        });

        newSocket.on('whatsapp_disconnected', () => {
            console.log('[WA Hook] WhatsApp desconectado');
            setQr('');
            setIsReady(false);
            setStatus('disconnected');
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return { qr, isReady, socket, status };
};
