import React from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { WhatsAppChat } from '../../types';

interface ChatListProps {
    chats: WhatsAppChat[];
    selectedChatId: string | null;
    onSelectChat: (id: string) => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ chats, selectedChatId, onSelectChat, searchQuery, onSearchChange }) => {
    // Format helper
    const formatTime = (isoString: string) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="w-[400px] flex flex-col h-full border-r border-[#d1d7db] bg-white">
            {/* Header */}
            <div className="h-[60px] bg-white px-4 flex items-center justify-between shrink-0">
                <h1 className="text-[22px] font-bold text-[#111b21]">Conversas</h1>
                <div className="flex gap-4">
                    <button title="Nova Conversa">
                        <Plus className="w-6 h-6 text-[#54656f]" />
                    </button>
                    <button title="Filtro de conversas não lidas">
                        <Filter className="w-5 h-5 text-[#54656f]" />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-3 pb-3 relative shrink-0">
                <div className="bg-[#f0f2f5] rounded-lg h-[35px] flex items-center px-3 gap-3 transition-all focus-within:shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                    <Search className="w-5 h-5 text-[#54656f] shrink-0" />
                    <input
                        type="text"
                        placeholder="Pesquisar ou começar uma nova conversa"
                        className="bg-transparent border-none outline-none text-[15px] w-full text-[#3b4a54] placeholder-[#54656f]"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Archived (Visual only) */}
            <div className="px-4 py-3 flex items-center gap-4 hover:bg-[#f5f6f6] cursor-pointer border-t border-[#f0f2f5]">
                <div className="w-5 flex justify-center">
                    <div className="w-4 h-4 border-2 border-[#54656f] rounded-sm opacity-50"></div>
                </div>
                <span className="text-[17px] text-[#111b21] font-normal">Arquivadas</span>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {chats.length === 0 ? (
                    <div className="text-center p-10 text-[#54656f]">
                        <p>Nenhuma conversa encontrada</p>
                        <p className="text-sm mt-2">Se conectou agora, aguarde a sincronização.</p>
                    </div>
                ) : (
                    chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => onSelectChat(chat.id)}
                            className={`flex h-[72px] px-3 items-center cursor-pointer hover:bg-[#f5f6f6] group relative ${selectedChatId === chat.id ? 'bg-[#f0f2f5]' : 'bg-white'}`}
                        >
                            <div className="w-[49px] h-[49px] rounded-full overflow-hidden flex-shrink-0 mr-3">
                                <img src={chat.avatar || `https://ui-avatars.com/api/?name=${chat.name || chat.phoneNumber}&background=random`} className="w-full h-full object-cover" alt="" />
                            </div>

                            <div className="flex-1 min-w-0 h-full flex flex-col justify-center border-b border-[#f0f2f5] group-last:border-none pr-1">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <span className="text-[17px] text-[#111b21] font-normal truncate">{chat.name || chat.phoneNumber}</span>
                                    <span className={`text-[12px] ${chat.unreadCount > 0 ? 'text-[#00a884] font-medium' : 'text-[#667781]'}`}>
                                        {formatTime(chat.lastMessageTime)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[14px] text-[#667781] truncate max-w-[90%]">
                                        {chat.lastMessage}
                                    </p>
                                    <div className="flex flex-col items-end gap-1">
                                        {chat.unreadCount > 0 && (
                                            <span className="bg-[#00a884] text-white text-[12px] font-bold min-w-[1.25rem] h-[1.25rem] flex items-center justify-center rounded-full px-1">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
