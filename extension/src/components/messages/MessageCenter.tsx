import { useState, useEffect } from 'react';
import { WhatsAppScraper } from '../../content/scraper';

type Template = {
    id: string;
    title: string;
    content: string;
    category: 'welcome' | 'negotiation' | 'closing' | 'custom';
};

type QuickReply = {
    id: string;
    label: string;
    text: string;
};

const DEFAULT_TEMPLATES: Template[] = [
    { id: '1', title: 'Boas-vindas Imobiliária', category: 'welcome', content: 'Olá! Agradecemos o contato. Sou especialista em imóveis na região. Como posso lhe ajudar hoje?' },
    { id: '2', title: 'Agendamento de Visita', category: 'negotiation', content: 'Gostaria de agendar uma visita ao imóvel? Tenho horários disponíveis na terça e quinta. Qual fica melhor?' },
    { id: '3', title: 'Cobrança de Retorno', category: 'negotiation', content: 'Olá, conseguiu avaliar a proposta que enviei? Estamos com outros interessados e gostaria de dar prioridade a você.' },
];

const MOCK_REPLIES: QuickReply[] = [
    { id: '1', label: '📞 Me ligue', text: 'Pode me ligar agora?' },
    { id: '2', label: '📍 Localização', text: 'Vou te enviar a localização exata.' },
    { id: '3', label: '💲 Preço', text: 'O valor está sujeito a alterações sem aviso prévio.' },
    { id: '4', label: '🤝 Obrigado', text: 'Muito obrigado, fico à disposição!' },
];

export function MessageCenter() {
    const [activeTab, setActiveTab] = useState<'templates' | 'quick'>('templates');
    const [search, setSearch] = useState('');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [newTemplateMode, setNewTemplateMode] = useState(false);
    const [newTemplateDraft, setNewTemplateDraft] = useState({ title: '', content: '' });

    // Load templates
    useEffect(() => {
        chrome.storage.local.get('crm_message_templates').then(res => {
            if (res.crm_message_templates) {
                setTemplates(res.crm_message_templates as any);
            } else {
                setTemplates(DEFAULT_TEMPLATES);
            }
        });
    }, []);

    const saveTemplates = (newList: Template[]) => {
        setTemplates(newList);
        chrome.storage.local.set({ crm_message_templates: newList });
    };

    const handleAddTemplate = () => {
        if (!newTemplateDraft.title || !newTemplateDraft.content) return;
        const newItem: Template = {
            id: Date.now().toString(),
            title: newTemplateDraft.title,
            content: newTemplateDraft.content,
            category: 'custom'
        };
        saveTemplates([newItem, ...templates]);
        setNewTemplateMode(false);
        setNewTemplateDraft({ title: '', content: '' });
    };

    const handleDelete = (id: string) => {
        if (confirm('Excluir este template?')) {
            const next = templates.filter(t => t.id !== id);
            saveTemplates(next);
        }
    };

    const filteredTemplates = templates.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

    const handleUseTemplate = (text: string) => {
        // Try injection first
        const success = WhatsAppScraper.insertMessage(text);
        if (success) {
            // Optional: visual feedback could go here
        } else {
            // Fallback
            navigator.clipboard.writeText(text);
            alert('Texto copiado! (Cole na caixa de mensagem)');
        }
    };

    return (
        <div className="h-full bg-slate-50 flex flex-col">
            <div className="p-4 bg-white border-b border-slate-200">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-display text-lg font-bold text-slate-900">Mensagens</h2>
                    {activeTab === 'templates' && !newTemplateMode && (
                        <button
                            onClick={() => setNewTemplateMode(true)}
                            className="text-[10px] font-bold bg-brand-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-brand-700 transition"
                        >
                            + Novo
                        </button>
                    )}
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'templates' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Templates
                    </button>
                    <button
                        onClick={() => setActiveTab('quick')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'quick' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Respostas Rápidas
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'templates' && (
                    <div className="space-y-4">
                        {newTemplateMode ? (
                            <div className="bg-white p-4 rounded-xl border border-brand-200 shadow-sm animate-panel-in">
                                <h3 className="text-xs font-bold text-slate-900 mb-3">Novo Template</h3>
                                <div className="space-y-3">
                                    <input
                                        value={newTemplateDraft.title}
                                        onChange={e => setNewTemplateDraft({ ...newTemplateDraft, title: e.target.value })}
                                        placeholder="Título (ex: Boas vindas)"
                                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                                    />
                                    <textarea
                                        value={newTemplateDraft.content}
                                        onChange={e => setNewTemplateDraft({ ...newTemplateDraft, content: e.target.value })}
                                        placeholder="Conteúdo da mensagem..."
                                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 min-h-[80px]"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setNewTemplateMode(false)} className="text-xs font-bold text-slate-500 px-3 py-1.5 hover:bg-slate-50 rounded-lg">Cancelar</button>
                                        <button onClick={handleAddTemplate} className="text-xs font-bold bg-brand-600 text-white px-3 py-1.5 rounded-lg shadow-sm">Salvar</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar template..."
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-300"
                                />
                                <div className="space-y-3">
                                    {filteredTemplates.map(t => (
                                        <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-3 hover:border-brand-200 transition group relative">
                                            {t.category === 'custom' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                                    className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                                    title="Excluir"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="font-bold text-xs text-slate-800">{t.title}</h3>
                                                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${t.category === 'custom' ? 'bg-brand-50 text-brand-600' : 'bg-slate-50 text-slate-400'}`}>{t.category}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 line-clamp-3 mb-3">{t.content}</p>
                                            <button
                                                onClick={() => handleUseTemplate(t.content)}
                                                className="w-full py-1.5 bg-slate-50 text-brand-600 text-[10px] font-bold rounded-lg border border-slate-100 hover:bg-brand-50 hover:border-brand-200 transition"
                                            >
                                                Usar Template
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'quick' && (
                    <div className="grid grid-cols-2 gap-3">
                        {MOCK_REPLIES.map(r => (
                            <button
                                key={r.id}
                                onClick={() => handleUseTemplate(r.text)}
                                className="bg-white border border-slate-200 p-3 rounded-xl flex flex-col items-center gap-2 hover:border-brand-300 hover:bg-brand-50/30 transition text-center"
                            >
                                <span className="text-sm font-bold text-slate-700">{r.label}</span>
                                <span className="text-[9px] text-slate-400">Toque para enviar</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
