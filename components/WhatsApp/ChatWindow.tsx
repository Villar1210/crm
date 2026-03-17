import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Smile, Mic, Plus } from 'lucide-react';
import { WhatsAppChat } from '../../types';

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
                    <img src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa66945.png" alt="WhatsApp Connected" className="w-[320px] opacity-70" />
                </div>
                <h1 className="text-[32px] text-[#41525d] font-light mb-5">WhatsApp Web</h1>
                <p className="text-[#667781] text-[14px] leading-6">
                    Envie e receba mensagens sem precisar manter seu celular conectado.<br />
                    Use o WhatsApp em até 4 aparelhos e 1 celular ao mesmo tempo.
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
                            <span className="leading-[19px] whitespace-pre-wrap break-words">{msg.text || msg.body}</span>

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
