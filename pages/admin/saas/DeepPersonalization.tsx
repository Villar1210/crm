import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, MessageSquare, Mail, Smartphone, Save, X, Sparkles, Eye } from 'lucide-react';
import { MessageTemplate, TemplateVariable } from '../../../types';

// Available smart variables
const AVAILABLE_VARIABLES: TemplateVariable[] = [
    // Lead variables
    { key: 'lead.name', label: 'Nome Completo', type: 'text', category: 'lead' },
    { key: 'lead.firstName', label: 'Primeiro Nome', type: 'text', category: 'lead' },
    { key: 'lead.email', label: 'Email', type: 'text', category: 'lead' },
    { key: 'lead.phone', label: 'Telefone', type: 'text', category: 'lead' },
    { key: 'lead.city', label: 'Cidade', type: 'text', category: 'lead', fallback: 'sua cidade' },
    { key: 'lead.state', label: 'Estado', type: 'text', category: 'lead' },
    { key: 'lead.birthDate', label: 'Data de Nascimento', type: 'date', category: 'lead' },
    { key: 'lead.age', label: 'Idade', type: 'number', category: 'lead' },
    { key: 'lead.assignedAgent', label: 'Corretor Responsável', type: 'text', category: 'lead' },

    // Property variables
    { key: 'property.title', label: 'Título do Imóvel', type: 'text', category: 'property' },
    { key: 'property.price', label: 'Preço', type: 'currency', category: 'property' },
    { key: 'property.address', label: 'Endereço', type: 'text', category: 'property' },
    { key: 'property.bedrooms', label: 'Quartos', type: 'number', category: 'property' },
    { key: 'property.link', label: 'Link do Imóvel', type: 'text', category: 'property' },

    // Deal variables
    { key: 'deal.value', label: 'Valor do Negócio', type: 'currency', category: 'deal' },
    { key: 'deal.stage', label: 'Etapa Atual', type: 'text', category: 'deal' },
    { key: 'deal.daysInStage', label: 'Dias na Etapa', type: 'number', category: 'deal' },

    // System variables
    { key: 'today', label: 'Data de Hoje', type: 'date', category: 'system' },
    { key: 'time', label: 'Hora Atual', type: 'text', category: 'system' },
    { key: 'company.name', label: 'Nome da Empresa', type: 'text', category: 'system' },
];

const DeepPersonalization: React.FC<{ showHeader?: boolean }> = ({ }) => {
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showVariables, setShowVariables] = useState(false);
    const [filterCategory, setFilterCategory] = useState<'all' | MessageTemplate['category']>('all');

    // Editor state
    const [editForm, setEditForm] = useState({
        name: '',
        category: 'custom' as MessageTemplate['category'],
        content: '',
        channel: 'whatsapp' as MessageTemplate['channel'],
        status: 'draft' as MessageTemplate['status'],
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = () => {
        const saved = localStorage.getItem('message_templates');
        if (saved) {
            setTemplates(JSON.parse(saved));
        } else {
            // Create sample templates
            const samples: MessageTemplate[] = [
                {
                    id: '1',
                    name: 'Parabéns - Aniversário',
                    category: 'birthday',
                    content: 'Olá {{lead.firstName}}! 🎉🎂\n\nParabéns pelos seus {{lead.age}} anos!\n\nComo presente, preparamos 10% OFF em qualquer imóvel.\n\nQue tal conhecer nossos lançamentos?\n\nAbraços,\n{{lead.assignedAgent}}\n{{company.name}}',
                    channel: 'whatsapp',
                    status: 'active',
                    variables: ['lead.firstName', 'lead.age', 'lead.assignedAgent', 'company.name'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: '2',
                    name: 'Follow-up - Lead Parado',
                    category: 'follow_up',
                    content: 'Oi {{lead.firstName}}, tudo bem?\n\nNotei que faz {{deal.daysInStage}} dias que não conversamos sobre o {{property.title}}.\n\nAinda tem interesse? Posso te ajudar com mais informações ou agendar uma visita.\n\n{{lead.assignedAgent}}',
                    channel: 'whatsapp',
                    status: 'active',
                    variables: ['lead.firstName', 'deal.daysInStage', 'property.title', 'lead.assignedAgent'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ];
            setTemplates(samples);
            localStorage.setItem('message_templates', JSON.stringify(samples));
        }
    };

    const saveTemplates = (updated: MessageTemplate[]) => {
        localStorage.setItem('message_templates', JSON.stringify(updated));
        setTemplates(updated);
    };

    const handleCreateNew = () => {
        setEditForm({
            name: '',
            category: 'custom',
            content: '',
            channel: 'whatsapp',
            status: 'draft',
        });
        setSelectedTemplate(null);
        setIsEditing(true);
    };

    const handleEdit = (template: MessageTemplate) => {
        setEditForm({
            name: template.name,
            category: template.category,
            content: template.content,
            channel: template.channel,
            status: template.status,
        });
        setSelectedTemplate(template);
        setIsEditing(true);
    };

    const handleSave = () => {
        const extractedVars = extractVariables(editForm.content);

        if (selectedTemplate) {
            // Update existing
            const updated = templates.map(t =>
                t.id === selectedTemplate.id
                    ? { ...t, ...editForm, variables: extractedVars, updatedAt: new Date().toISOString() }
                    : t
            );
            saveTemplates(updated);
        } else {
            // Create new
            const newTemplate: MessageTemplate = {
                id: Date.now().toString(),
                ...editForm,
                variables: extractedVars,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            saveTemplates([...templates, newTemplate]);
        }

        setIsEditing(false);
        setSelectedTemplate(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Deseja excluir este template?')) {
            const updated = templates.filter(t => t.id !== id);
            saveTemplates(updated);
            if (selectedTemplate?.id === id) {
                setSelectedTemplate(null);
                setIsEditing(false);
            }
        }
    };

    const extractVariables = (content: string): string[] => {
        const regex = /\{\{([^}]+)\}\}/g;
        const matches = content.match(regex);
        if (!matches) return [];
        return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '').trim()))];
    };

    const insertVariable = (varKey: string) => {
        setEditForm(prev => ({
            ...prev,
            content: prev.content + `{{${varKey}}}`
        }));
    };

    const generatePreview = (content: string): string => {
        let preview = content;
        const sampleData: Record<string, string> = {
            'lead.name': 'Roberto Silva',
            'lead.firstName': 'Roberto',
            'lead.email': 'roberto@email.com',
            'lead.phone': '(11) 99999-9999',
            'lead.city': 'São Paulo',
            'lead.state': 'SP',
            'lead.age': '35',
            'lead.assignedAgent': 'Eduardo Santos',
            'property.title': 'Apartamento Vista Mar',
            'property.price': 'R$ 850.000,00',
            'property.bedrooms': '3',
            'deal.value': 'R$ 850.000,00',
            'deal.daysInStage': '7',
            'today': new Date().toLocaleDateString('pt-BR'),
            'time': new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            'company.name': 'NovaMorada Imóveis',
        };

        Object.entries(sampleData).forEach(([key, value]) => {
            preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        });

        return preview;
    };

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryIcon = (category: MessageTemplate['category']) => {
        switch (category) {
            case 'birthday': return '🎂';
            case 'renewal': return '🔔';
            case 'reminder': return '📅';
            case 'follow_up': return '📞';
            default: return '📝';
        }
    };

    const getChannelIcon = (channel: MessageTemplate['channel']) => {
        switch (channel) {
            case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
            case 'email': return <Mail className="w-4 h-4" />;
            case 'sms': return <Smartphone className="w-4 h-4" />;
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-gray-900">Templates de Mensagem</h1>
                        <p className="text-sm text-gray-500 mt-1">Crie mensagens personalizadas com variáveis inteligentes</p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-700 flex items-center gap-2 shadow-lg shadow-brand-500/20"
                    >
                        <Plus className="w-5 h-5" /> Novo Template
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Template List */}
                <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
                    {/* Search & Filter */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar templates..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                            />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-1">
                            <button
                                onClick={() => setFilterCategory('all')}
                                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${filterCategory === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFilterCategory('birthday')}
                                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${filterCategory === 'birthday' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                            >
                                Aniversário
                            </button>
                            <button
                                onClick={() => setFilterCategory('follow_up')}
                                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${filterCategory === 'follow_up' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                            >
                                Follow-up
                            </button>
                        </div>
                    </div>

                    {/* Template List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredTemplates.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm">Nenhum template encontrado</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredTemplates.map(template => (
                                    <div
                                        key={template.id}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedTemplate?.id === template.id && !isEditing ? 'bg-brand-50 border-l-4 border-brand-600' : ''}`}
                                        onClick={() => !isEditing && setSelectedTemplate(template)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{getCategoryIcon(template.category)}</span>
                                                <h3 className="font-bold text-gray-900 text-sm">{template.name}</h3>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {getChannelIcon(template.channel)}
                                                {template.status === 'active' && (
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2">{template.content}</p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-xs text-gray-400">
                                                {template.variables.length} variável(is)
                                            </span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(template); }}
                                                    className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {isEditing ? (
                        /* Editor Mode */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900">
                                        {selectedTemplate ? 'Editar Template' : 'Novo Template'}
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" /> Cancelar
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={!editForm.name || !editForm.content}
                                            className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" /> Salvar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="max-w-4xl mx-auto space-y-6">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Template</label>
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                placeholder="Ex: Parabéns - Aniversário"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                                            <select
                                                value={editForm.category}
                                                onChange={e => setEditForm({ ...editForm, category: e.target.value as any })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                            >
                                                <option value="birthday">Aniversário</option>
                                                <option value="renewal">Renovação</option>
                                                <option value="reminder">Lembrete</option>
                                                <option value="follow_up">Follow-up</option>
                                                <option value="custom">Personalizado</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Canal</label>
                                            <div className="flex gap-2">
                                                {['whatsapp', 'email', 'sms'].map(ch => (
                                                    <button
                                                        key={ch}
                                                        onClick={() => setEditForm({ ...editForm, channel: ch as any })}
                                                        className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${editForm.channel === ch ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}
                                                    >
                                                        {ch === 'whatsapp' && 'WhatsApp'}
                                                        {ch === 'email' && 'Email'}
                                                        {ch === 'sms' && 'SMS'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                            <select
                                                value={editForm.status}
                                                onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                            >
                                                <option value="draft">Rascunho</option>
                                                <option value="active">Ativo</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Content Editor */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Conteúdo da Mensagem</label>
                                            <button
                                                onClick={() => setShowVariables(!showVariables)}
                                                className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1"
                                            >
                                                <Sparkles className="w-4 h-4" /> Variáveis Disponíveis
                                            </button>
                                        </div>

                                        {showVariables && (
                                            <div className="mb-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                                    {AVAILABLE_VARIABLES.map(v => (
                                                        <button
                                                            key={v.key}
                                                            onClick={() => insertVariable(v.key)}
                                                            className="text-left px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-brand-400 hover:bg-brand-50 transition-colors text-sm"
                                                        >
                                                            <div className="font-mono text-xs text-brand-600">{`{{${v.key}}}`}</div>
                                                            <div className="text-xs text-gray-500 mt-0.5">{v.label}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <textarea
                                            value={editForm.content}
                                            onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-sm"
                                            rows={12}
                                            placeholder="Digite sua mensagem aqui. Use {{variavel}} para inserir dados dinâmicos."
                                        />

                                        <p className="text-xs text-gray-500 mt-2">
                                            {extractVariables(editForm.content).length} variável(is) detectada(s)
                                        </p>
                                    </div>

                                    {/* Preview */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Eye className="w-4 h-4 text-gray-600" />
                                            <label className="block text-sm font-medium text-gray-700">Preview (com dados de exemplo)</label>
                                        </div>
                                        <div className="p-4 bg-gray-900 text-white rounded-lg whitespace-pre-wrap font-sans text-sm">
                                            {generatePreview(editForm.content) || 'Digite algo no editor...'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : selectedTemplate ? (
                        /* View Mode */
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="max-w-3xl mx-auto">
                                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-2xl">{getCategoryIcon(selectedTemplate.category)}</span>
                                                <h2 className="text-2xl font-bold text-gray-900">{selectedTemplate.name}</h2>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                                                    {selectedTemplate.category}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedTemplate.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {selectedTemplate.status === 'active' ? 'Ativo' : 'Rascunho'}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleEdit(selectedTemplate)}
                                            className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 flex items-center gap-2"
                                        >
                                            <Edit2 className="w-4 h-4" /> Editar
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">Conteúdo</h3>
                                            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm">
                                                {selectedTemplate.content}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
                                            <div className="p-4 bg-gray-900 text-white rounded-lg whitespace-pre-wrap text-sm">
                                                {generatePreview(selectedTemplate.content)}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">Variáveis Utilizadas</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTemplate.variables.map((v: string) => (
                                                    <span key={v} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-mono">
                                                        {`{{${v}}}`}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex-1 flex items-center justify-center text-center p-8">
                            <div>
                                <MessageSquare className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Selecione um template</h3>
                                <p className="text-gray-500 mb-6">Escolha um template da lista ou crie um novo</p>
                                <button
                                    onClick={handleCreateNew}
                                    className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 inline-flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" /> Criar Primeiro Template
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeepPersonalization;
