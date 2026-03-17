import React from 'react';
import { X, PhoneCall, Calendar, DollarSign, StickyNote } from 'lucide-react';
import { WhatsAppChat } from '../../types';

interface CRMPanelProps {
    chat: WhatsAppChat | null;
    isVisible: boolean;
    onClose: () => void;
}

export const CRMPanel: React.FC<CRMPanelProps> = ({ chat, isVisible, onClose }) => {
    if (!chat || !isVisible) return null;

    return (
        <div className="w-[23.75rem] bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto custom-scrollbar shadow-lg z-20">
            {/* Header Profile */}
            <div className="bg-white p-6 flex flex-col items-center border-b border-gray-100 shadow-sm relative">
                <button onClick={onClose} className="absolute left-4 top-4 text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                </button>
                <img src={chat.avatar || `https://ui-avatars.com/api/?name=${chat.name}`} className="w-24 h-24 rounded-full object-cover mb-3 border-4 border-gray-50" alt="" />
                <h3 className="text-xl font-bold text-gray-800">{chat.name || chat.phoneNumber}</h3>
                <p className="text-gray-500 text-sm mb-4">{chat.phoneNumber}</p>

                <div className="flex gap-4 w-full px-4">
                    <button className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-bold hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors flex flex-col items-center gap-1">
                        <PhoneCall className="w-4 h-4" /> Ligar
                    </button>
                    <button className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-bold hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors flex flex-col items-center gap-1">
                        <Calendar className="w-4 h-4" /> Agendar
                    </button>
                </div>
            </div>

            {/* CRM Info Blocks */}
            <div className="p-4 space-y-4 bg-[#f7f8fa] flex-1">
                {/* Funnel Stage */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Etapa do Funil</h4>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:border-green-500">
                        <option value="new">Novos</option>
                        <option value="talking">Em Atendimento</option>
                        <option value="proposal">Proposta</option>
                    </select>
                </div>

                {/* Deal Value */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                        Valor do Negócio <DollarSign className="w-3.5 h-3.5" />
                    </h4>
                    <div className="flex items-center bg-green-50 rounded border border-green-200 px-3 py-2">
                        <span className="text-green-700 font-bold mr-2">R$</span>
                        <input type="text" className="bg-transparent font-bold text-green-800 outline-none w-full" defaultValue="0,00" />
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <StickyNote className="w-3.5 h-3.5" /> Anotações
                    </h4>
                    <textarea
                        className="w-full bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-gray-700 resize-none outline-none focus:ring-1 focus:ring-yellow-400 placeholder-yellow-700/40"
                        rows={4}
                        placeholder="Escreva uma nota..."
                    ></textarea>
                </div>
            </div>
        </div>
    );
};
