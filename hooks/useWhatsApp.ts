import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export const useWhatsApp = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [qr, setQr] = useState<string>('');
    const [status, setStatus] = useState<'disconnected' | 'connected' | 'restoring'>('disconnected');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const newSocket = io('http://localhost:3001', {
            transports: ['websocket'],
            reconnection: true,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setStatus('connected');
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setStatus('disconnected');
            setIsReady(false);
        });

        newSocket.on('whatsapp_qr', (qrCode: string) => {
            setQr(qrCode);
            setStatus('connected'); // Back to connected (waiting for scan)
            setIsReady(false);
        });

        newSocket.on('whatsapp_authenticated', () => {
            console.log('Authenticated, waiting for ready...');
            setQr('');
            setStatus('restoring');
        });

        newSocket.on('whatsapp_ready', () => {
            setQr('');
            setIsReady(true);
            setStatus('connected');
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return { qr, isReady, socket, status };
};
