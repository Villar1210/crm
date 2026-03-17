import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Loader2, Smartphone } from 'lucide-react';

import { api } from '../../services/api';
import { WhatsAppLayout } from '../../components/WhatsApp/Layout';
import { ChatList } from '../../components/WhatsApp/ChatList';
import { ChatWindow } from '../../components/WhatsApp/ChatWindow';
import { WhatsAppConfig } from '../../components/WhatsApp/Config/WhatsAppConfig';
import { CRMPanel } from '../../components/WhatsApp/CRMPanel';

import { useWhatsApp } from '../../hooks/useWhatsApp';
import { whatsappService } from '../../services/whatsappService';
import { WhatsAppChat } from '../../types';

const WhatsAppStation: React.FC = () => {
    // Persist mode in localStorage (Must be declared first to be used in conditionals)
    const [integrationMode, setIntegrationMode] = useState<'platform' | 'official' | 'extension'>(() => {
        const saved = localStorage.getItem('whatsapp_mode');
        return (saved as 'platform' | 'official' | 'extension') || 'platform';
    });

    const handleSaveMode = (mode: 'platform' | 'official' | 'extension') => {
        setIntegrationMode(mode);
        localStorage.setItem('whatsapp_mode', mode);
        setShowConfig(false);
    };

    // New: Sync with Global CRM Settings
    useEffect(() => {
        const syncSettings = async () => {
            try {
                const settings = await api.crm.getSettings();
                if (settings && settings.whatsappIntegrationMode) {
                    setIntegrationMode(settings.whatsappIntegrationMode);
                    localStorage.setItem('whatsapp_mode', settings.whatsappIntegrationMode);
                }
            } catch (error) {
                console.error('Failed to sync settings:', error);
            }
        };
        syncSettings();
    }, []);

    // Connection State
    const { qr, isReady, socket, status } = useWhatsApp();

    // UI State
    const [chats, setChats] = useState<WhatsAppChat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showRightSidebar, setShowRightSidebar] = useState(true);
    const [loadingChats, setLoadingChats] = useState(false);
    console.log(loadingChats); // Debug loading state

    // Initial Load & Socket Events
    useEffect(() => {
        if (isReady) {
            loadChats();
        }
    }, [isReady]);

    useEffect(() => {
        if (socket) {
            socket.on('whatsapp_message', () => {
                console.log('New message received, refreshing chats...');
                loadChats();
            });
        }
        return () => {
            if (socket) socket.off('whatsapp_message');
        };
    }, [socket]);

    const loadChats = async () => {
        setLoadingChats(true);
        const data = await whatsappService.getChats();
        if (data && Array.isArray(data)) {
            // Sort by time
            const sorted = data.sort((a, b) => (b.lastMessageTime || '').localeCompare(a.lastMessageTime || ''));
            setChats(sorted);
        }
        setLoadingChats(false);
    };

    const handleSendMessage = async (text: string) => {
        const chat = chats.find(c => c.id === selectedChatId);
        if (!chat) return;

        // Optimistic Update (Optional)
        // ...

        const success = await whatsappService.sendMessage(chat.phoneNumber, text);
        if (success) {
            loadChats(); // Refresh to show sent message
        } else {
            alert('Falha ao enviar mensagem');
        }
    };

    // Derived State
    const filteredChats = chats.filter(c =>
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phoneNumber || '').includes(searchQuery)
    );
    const selectedChat = chats.find(c => c.id === selectedChatId) || null;

    // --- RENDER: CONNECT SCREEN (Only for Platform Mode) ---
    if (integrationMode === 'platform' && !isReady) {
        return (
            <div className="flex h-screen bg-[#111b21] items-center justify-center font-sans text-white">
                <div className="bg-white text-gray-800 p-8 rounded-xl shadow-2xl flex flex-col items-center max-w-md w-full text-center">
                    <div className="mb-6 relative">
                        {qr ? (
                            <div className="border-4 border-white shadow-lg">
                                <QRCodeCanvas value={qr} size={256} />
                            </div>
                        ) : (
                            <div className="w-64 h-64 bg-gray-100 animate-pulse flex items-center justify-center rounded">
                                <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
                            </div>
                        )}
                        {/* Status Overlay */}
                        {/* Status Overlay */}
                        <div className="mt-4 font-bold text-gray-600">
                            {status === 'connected' && !qr ? 'Carregando WhatsApp...' : ''}
                            {status === 'connected' && qr ? 'Aguardando QR Code...' : ''}
                            {status === 'disconnected' && ' Conectando ao servidor...'}
                            {status === 'restoring' && 'Conectado! Sincronizando conversas...'}
                        </div>
                    </div>

                    <h2 className="text-2xl font-light mb-2">WhatsApp CRM</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Abra o WhatsApp no seu celular e escaneie o código para conectar.
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-4 py-2 rounded-full">
                        <Smartphone className="w-4 h-4" /> Integração Segura via Socket.IO
                    </div>
                </div>
            </div>
        );
    }

    // Fetch messages when a chat is selected
    useEffect(() => {
        if (selectedChatId) {
            loadMessages(selectedChatId);
        }
    }, [selectedChatId]);

    const loadMessages = async (chatId: string) => {
        const messages = await whatsappService.getMessages(chatId);
        if (messages) {
            setChats(prev => prev.map(c =>
                c.id === chatId ? { ...c, messages: messages } : c
            ));
        }
    };

    const [showConfig, setShowConfig] = useState(false);

    // --- RENDER: MAIN INTERFACE ---
    return (
        <>
            <WhatsAppLayout onConfig={() => setShowConfig(true)}>
                {integrationMode === 'platform' && (
                    <>
                        <ChatList
                            chats={filteredChats}
                            selectedChatId={selectedChatId}
                            onSelectChat={setSelectedChatId}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                        />

                        <ChatWindow
                            chat={selectedChat}
                            onSendMessage={handleSendMessage}
                            showRightSidebar={showRightSidebar}
                            onToggleRightSidebar={() => setShowRightSidebar(!showRightSidebar)}
                        />

                        <CRMPanel
                            chat={selectedChat}
                            isVisible={showRightSidebar && !!selectedChat}
                            onClose={() => setShowRightSidebar(false)}
                        />
                    </>
                )}

                {integrationMode === 'extension' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 text-center">
                        <div className="max-w-2xl">
                            <h2 className="text-3xl font-bold text-gray-800 mb-4">Modo Extensão Ativado 🧩</h2>
                            <p className="text-gray-600 mb-8 text-lg">
                                Neste modo, o CRM funciona diretamente dentro do <b>WhatsApp Web oficial</b>.
                            </p>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-left">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">1</span>
                                    Como usar:
                                </h3>
                                <ul className="space-y-3 text-gray-600">
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>
                                        <span>Abra o <a href="https://web.whatsapp.com" target="_blank" className="text-blue-600 hover:underline">web.whatsapp.com</a> em uma nova aba.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>
                                        <span>Clique no botão flutuante <b>"CRM"</b> no canto inferior direito.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>
                                        <span>Use o painel lateral para gerenciar os dados dos seus clientes.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {integrationMode === 'official' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">API Oficial (Meta Business)</h2>
                        <p className="text-gray-500">Este módulo será implementado em breve.</p>
                    </div>
                )}
            </WhatsAppLayout>

            <WhatsAppConfig
                isOpen={showConfig}
                onClose={() => setShowConfig(false)}
                currentMode={integrationMode}
                onSave={handleSaveMode}
            />
        </>
    );
};

export default WhatsAppStation;
