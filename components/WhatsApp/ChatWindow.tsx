import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Smile, Mic, Plus, Image, Video, Music, FileText, MapPin, User, Sticker } from 'lucide-react';
import { WhatsAppChat } from '../../types';

// Renders message body with media type icons
const MEDIA_LABELS: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    '📷': { icon: Image, color: 'text-green-600', label: 'Foto' },
    '🎥': { icon: Video, color: 'text-blue-600', label: 'Vídeo' },
    '🎤': { icon: Mic, color: 'text-purple-600', label: 'Áudio' },
    '🎵': { icon: Music, color: 'text-purple-600', label: 'Áudio' },
    '📄': { icon: FileText, color: 'text-orange-600', label: 'Documento' },
    '📍': { icon: MapPin, color: 'text-red-600', label: 'Localização' },
    '👤': { icon: User, color: 'text-gray-600', label: 'Contato' },
    '😀': { icon: Sticker, color: 'text-yellow-500', label: 'Sticker' },
};

const MessageBody: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;

    // Check if it's a media label (starts with known emoji)
    const firstChar = text.slice(0, 2);
    const mediaInfo = MEDIA_LABELS[firstChar];
    if (mediaInfo) {
        const IconComp = mediaInfo.icon;
        const caption = text.slice(2).trim();
        return (
            <span className={`inline-flex items-center gap-1.5 ${mediaInfo.color} text-sm italic`}>
                <IconComp className="w-3.5 h-3.5 shrink-0" />
                {caption || mediaInfo.label}
            </span>
        );
    }

    // Legacy [mídia] fallback
    if (text === '[mídia]') {
        return (
            <span className="inline-flex items-center gap-1.5 text-gray-400 text-sm italic">
                <Image className="w-3.5 h-3.5 shrink-0" /> Mídia
            </span>
        );
    }

    return <span className="leading-[19px] whitespace-pre-wrap break-words">{text}</span>;
};

interface ChatWindowProps {
    chat: WhatsAppChat | null;
    onSendMessage: (text: string) => void;
    showRightSidebar: boolean;
    onToggleRightSidebar: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat, onSendMessage, onToggleRightSidebar }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chat?.messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        onSendMessage(input);
        setInput('');
    };

    if (!chat) return (
        <div className="flex-1 h-full bg-[#f0f2f5] border-b-[6px] border-[#25d366] flex flex-col items-center justify-center text-center px-10 relative">
            <div className="max-w-[560px] flex flex-col items-center">
                <div className="mb-10">
                    {/* WhatsApp logo SVG — sem dependência de CDN externo */}
                    <svg viewBox="0 0 212 212" className="w-48 h-48 opacity-60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="106" cy="106" r="106" fill="#25D366"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M106 36C68.4 36 38 66.4 38 104c0 13.2 3.7 25.6 10.1 36.2L36 176l37.1-11.7C83.6 170.5 94.5 174 106 174c37.6 0 68-30.4 68-68S143.6 36 106 36zm0 124.5c-11.4 0-22-3.2-31-8.7l-2.2-1.3-22 7 7.2-21.3-1.4-2.3C50.3 125.5 47 115.1 47 104c0-32.5 26.5-59 59-59s59 26.5 59 59-26.5 59-59 59z" fill="white"/>
                        <path d="M140.5 119.2c-1.8-.9-10.5-5.2-12.1-5.8-1.6-.6-2.8-.9-3.9.9-1.2 1.8-4.5 5.8-5.5 6.9-1 1.1-2 1.3-3.8.4-1.8-.9-7.5-2.8-14.3-8.8-5.3-4.7-8.8-10.5-9.9-12.3-1-1.8-.1-2.8.8-3.6.8-.8 1.8-2 2.7-3 .9-1 1.2-1.8 1.8-3 .6-1.2.3-2.1-.1-3-.4-.9-3.9-9.4-5.4-12.9-1.4-3.4-2.8-2.9-3.9-3h-3.3c-1.1 0-3 .4-4.6 2.2-1.6 1.8-6.1 5.9-6.1 14.5 0 8.5 6.2 16.8 7.1 17.9.9 1.2 12.2 18.6 29.5 26.1 4.1 1.8 7.4 2.9 9.9 3.7 4.1 1.3 7.9 1.1 10.8.7 3.3-.5 10.2-4.2 11.6-8.2 1.4-4 1.4-7.5 1-8.2-.5-.7-1.6-1.1-3.4-2z" fill="white"/>
                    </svg>
                </div>
                <h1 className="text-[32px] text-[#41525d] font-light mb-5">WhatsApp Web</h1>
                <p className="text-[#667781] text-[14px] leading-6">
                    Selecione uma conversa para começar a mensagem.<br />
                    Mensagens enviadas pelo CRM aparecem aqui.
                </p>
            </div>
            <div className="absolute bottom-10 text-[13px] text-[#8696a0] flex items-center gap-1">
                <span className="text-[10px]">🔒</span> Protegido com criptografia de ponta a ponta
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-[#efeae2] relative min-w-0">
            {/* Header */}
            <div className="h-[60px] bg-[#f0f2f5] px-4 py-2.5 flex justify-between items-center border-b border-[#d1d7db] shrink-0 z-20">
                <div className="flex items-center gap-3 cursor-pointer" onClick={onToggleRightSidebar}>
                    <img src={chat.avatar || `https://ui-avatars.com/api/?name=${chat.name}&background=random`} className="w-10 h-10 rounded-full object-cover" alt="" />
                    <div className="flex flex-col justify-center">
                        <h3 className="text-[#111b21] font-normal text-[16px] leading-[1.2]">{chat.name || chat.phoneNumber}</h3>
                        <p className="text-[13px] text-[#667781] truncate">clique para dados do lead</p>
                    </div>
                </div>
                <div className="flex items-center gap-6 text-[#54656f]">
                    <Search className="w-6 h-6 cursor-pointer" />
                    <MoreVertical className="w-6 h-6 cursor-pointer" onClick={onToggleRightSidebar} />
                </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-40"
                style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 z-10 custom-scrollbar relative px-[5%] lg:px-[9%]">
                {/* Security Notice */}
                <div className="flex justify-center my-4">
                    <div className="bg-[#ffEeda] p-2 rounded-lg text-[12.5px] text-[#54656f] shadow-sm text-center max-w-[80%]">
                        🔒 As mensagens são protegidas com a criptografia de ponta a ponta. Ninguém fora dessa conversa, nem mesmo o WhatsApp, pode ler ou ouvi-las.
                    </div>
                </div>

                {chat.messages && chat.messages.map((msg, idx) => (
                    <div key={msg.id || idx} className={`flex w-full mb-1 ${msg.sender === 'user' || msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                             group relative max-w-[65%] text-[14.2px] text-[#111b21] p-1.5 pl-2.5 pr-2.5 rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]
                             ${msg.sender === 'user' || msg.from === 'me' ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}
                         `}>
                            {/* Tail SVG Mock (Simplified) */}
                            <MessageBody text={msg.text || msg.body || ''} />

                            <div className="flex justify-end items-center gap-1 mt-1 -mr-1 float-right ml-2 relative top-1">
                                <span className="text-[11px] text-[#667781]">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                {/* Checkmarks would go here */}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[#f0f2f5] px-4 py-2 min-h-[62px] z-20 flex items-end gap-3 border-t border-[#d1d7db] shrink-0">
                <div className="flex gap-4 pb-3 text-[#54656f]">
                    <Smile className="w-6 h-6 cursor-pointer" />
                    <Plus className="w-6 h-6 cursor-pointer" />
                </div>
                <div className="flex-1 bg-white rounded-lg flex items-end py-2.5 px-3 mb-1.5 border border-white focus-within:border-white">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                        className="w-full max-h-[100px] outline-none text-[15px] text-[#111b21] bg-transparent placeholder-[#667781]"
                        placeholder="Digite uma mensagem"
                    />
                </div>
                <div className="pb-3 text-[#54656f]">
                    {input.trim() ? (
                        <div onClick={handleSend} className="cursor-pointer text-[#00a884]">
                            {/* Send Icon standard for WA */}
                            <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" version="1.1" x="0px" y="0px" enableBackground="new 0 0 24 24"><path fill="currentColor" d="M1.101,21.757L23.8,12.028L1.101,2.3l0.011,7.912l13.623,1.816L1.112,13.845 L1.101,21.757z"></path></svg>
                        </div>
                    ) : (
                        <Mic className="w-6 h-6 cursor-pointer" />
                    )}
                </div>
            </div>
        </div>
    );
};
