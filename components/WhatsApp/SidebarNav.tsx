import React from 'react';
import { Zap, MessageCircle, Send, Kanban, Settings } from 'lucide-react';

export const SidebarNav: React.FC = () => {
    return (
        <div className="w-[3.75rem] bg-[#202c33] flex flex-col items-center py-4 gap-4 text-[#aebac1]">
            <div className="mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Zap className="w-5 h-5 fill-white" />
                </div>
            </div>

            <button className="p-2.5 rounded-xl bg-[#2a3942] text-green-400 transition-all" title="Conversas">
                <MessageCircle className="w-[1.375rem] h-[1.375rem]" />
            </button>

            <button className="p-2.5 rounded-xl hover:bg-[#2a3942] hover:text-white transition-all" title="Disparo em Massa">
                <Send className="w-[1.375rem] h-[1.375rem]" />
            </button>

            <button className="p-2.5 rounded-xl hover:bg-[#2a3942] hover:text-white transition-all" title="CRM Kanban">
                <Kanban className="w-[1.375rem] h-[1.375rem]" />
            </button>

            <div className="mt-auto flex flex-col gap-4">
                <button className="p-2.5 hover:text-white transition-colors" title="Configurações API">
                    <Settings className="w-[1.375rem] h-[1.375rem]" />
                </button>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#aebac1]">
                    <img src="https://i.pravatar.cc/150?u=admin" alt="Profile" />
                </div>
            </div>
        </div>
    );
};
