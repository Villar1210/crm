import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface WhatsAppConfigProps {
    isOpen: boolean;
    onClose: () => void;
    currentMode: 'platform' | 'official' | 'extension';
    onSave: (mode: 'platform' | 'official' | 'extension') => void;
}

export const WhatsAppConfig: React.FC<WhatsAppConfigProps> = ({ isOpen, onClose, currentMode, onSave }) => {
    const [selectedMode, setSelectedMode] = useState<'platform' | 'official' | 'extension'>(currentMode);

    if (!isOpen) return null;

    const cards = [
        {
            id: 'platform',
            title: 'Plataforma (Web Clone)',
            description: 'Usa uma sessão real do WhatsApp Web rodando no servidor. Scaneie o QR Code e use.',
            active: true
        },
        {
            id: 'official',
            title: 'API Oficial (Meta Business)',
            description: 'Conexão via API Oficial da Meta. Requer aprovação da empresa e custos por mensagem.',
            active: false
        },
        {
            id: 'extension',
            title: 'Extensão do Chrome',
            description: 'Injeta o CRM dentro da aba do WhatsApp Web oficial no seu navegador.',
            active: false
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="bg-[#f0f2f5] px-6 py-4 flex justify-between items-center border-b border-[#d1d7db]">
                    <h2 className="text-xl font-semibold text-[#111b21]">Configuração de Integração</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-[#54656f]" />
                    </button>
                </div>

                <div className="p-6">
                    <h3 className="text-lg font-medium text-[#111b21] mb-4">Escolha o Modo de Operação</h3>

                    <div className="grid gap-4">
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                onClick={() => setSelectedMode(card.id as any)}
                                className={`
                                    relative border-2 rounded-lg p-5 cursor-pointer transition-all
                                    ${selectedMode === card.id ? 'border-[#00a884] bg-[#f0f9f6]' : 'border-gray-200 hover:border-gray-300'}
                                    ${!card.active && 'opacity-60 cursor-not-allowed'}
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-[#111b21] text-lg">{card.title}</h4>
                                        <p className="text-[#54656f] text-sm mt-1 max-w-lg">{card.description}</p>
                                    </div>
                                    <div className={`
                                        w-6 h-6 rounded-full border-2 flex items-center justify-center
                                        ${selectedMode === card.id ? 'border-[#00a884] bg-[#00a884]' : 'border-gray-300'}
                                    `}>
                                        {selectedMode === card.id && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                </div>
                                {!card.active && (
                                    <span className="absolute top-2 right-2 bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">Em Breve</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-[#00a884] font-semibold hover:bg-[#f0f2f5] rounded-full transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => { onSave(selectedMode); onClose(); }}
                            className="px-6 py-2.5 bg-[#00a884] text-white font-semibold rounded-full hover:bg-[#008f6f] transition-colors shadow-sm"
                        >
                            Salvar Configuração
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
