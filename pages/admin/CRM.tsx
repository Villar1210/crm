
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search, Plus, Calendar, Phone, Mail, MapPin, Tag,
    ChevronDown, ChevronRight, X, User, DollarSign, Briefcase, FileText,
    CheckCircle, Clock, Settings, LayoutList, Kanban,
    MessageSquare, Send, Trash2, Copy,
    RotateCcw, Save, Layers, List, GitCommit, Users, Check, Building, Key,
    TrendingUp, Folder, Upload, FileCheck, ShoppingBag, CreditCard, Box, Database,
    Globe, BarChart2, Info, Bot, Zap, Sparkles, Instagram, MessageCircle, Flame, Snowflake,
    AlertTriangle, GripVertical, Palette, ChevronUp, ChevronLeft, ScrollText, Home, Activity, PieChart, Download, Image as ImageIcon, Rocket, Eye
} from 'lucide-react';
import { api } from '../../services/api';
import { API_BASE_URL } from '../../services/apiConfig';
import { Lead, LeadStatus, Task, ActivityType, User as UserType, CRMSettings, Property, Pipeline, PipelineStage, PipelineGroup } from '../../types';
import { MOCK_USERS, DEFAULT_PIPELINE, MOCK_CAMPAIGNS } from '../../constants';
import { realEstatePropertiesMock } from '../../mocks/realEstateMocks';
import LeadRoulette from './LeadRoulette';




// --- FUNIL DE ATENDIMENTO & SCRIPTS (Baseado no PDF) ---
const FUNNEL_PHASES = {
    PROSPECTION: {
        id: 1,
        title: 'Primeiro contato',
        color: 'bg-blue-600',
        statuses: [LeadStatus.NEW, LeadStatus.TRIAGE],
        questions: [
            "Você procura imóvel para moradia ou investimento?",
            "Qual região você tem preferência?",
            "Já conhece algum empreendimento na área?",
            "Qual sua expectativa de preço?",
            "Precisa de vaga? Quantos dormitórios?"
        ]
    },
    QUALIFICATION: {
        id: 2,
        title: 'Agendar visita',
        color: 'bg-cyan-500',
        statuses: [LeadStatus.QUALIFIED],
        questions: [
            "Qual sua renda familiar?",
            "Pretende financiar, usar FGTS ou comprar à vista?",
            "Já visitou algum decorado?",
            "Quando pretende se mudar ou investir?",
            "Tem mais alguém na decisão?"
        ]
    },
    OPPORTUNITY: {
        id: 3,
        title: 'Follow-up (sumido)',
        color: 'bg-amber-500',
        statuses: [LeadStatus.VISIT_SCHEDULED, LeadStatus.PROPOSAL, LeadStatus.NEGOTIATION],
        questions: [
            "O que pesa mais: localização, metragem ou valor?",
            "Prefere planta compacta ou ampla?",
            "Posso enviar vídeo do decorado?",
            "Quer que eu simule opções de pagamento?",
            "Vamos agendar sua visita?"
        ]
    },
    CLOSING: {
        id: 4,
        title: 'Proposta',
        color: 'bg-red-500',
        statuses: [LeadStatus.CLOSED],
        questions: [
            "Qual valor consegue de entrada hoje?",
            "Prefere parcelar a entrada?",
            "Podemos formalizar sua proposta?",
            "Preferência: assinatura digital ou presencial?",
            "Envio lista de documentos para adiantar?"
        ]
    }
};



// Helper to get current phase based on lead status
const getCurrentFunnelPhase = (status: LeadStatus) => {
    if (FUNNEL_PHASES.PROSPECTION.statuses.includes(status)) return FUNNEL_PHASES.PROSPECTION;
    if (FUNNEL_PHASES.QUALIFICATION.statuses.includes(status)) return FUNNEL_PHASES.QUALIFICATION;
    if (FUNNEL_PHASES.OPPORTUNITY.statuses.includes(status)) return FUNNEL_PHASES.OPPORTUNITY;
    if (FUNNEL_PHASES.CLOSING.statuses.includes(status)) return FUNNEL_PHASES.CLOSING;
    return FUNNEL_PHASES.PROSPECTION; // Default
};

// WhatsApp Scripts Template
const WHATSAPP_TEMPLATES = [
    { id: 1, title: '👋 Primeiro Contato', text: 'Olá [Nome], sou [Seu Nome] da NovaMorada. Vi seu interesse no imóvel [Imóvel] e gostaria de te passar mais detalhes. Podemos falar?' },
    { id: 2, title: '📅 Agendar Visita', text: 'Oi [Nome], tudo bem? Que tal agendarmos uma visita ao [Imóvel] neste sábado? Tenho um horário livre às 10h.' },
    { id: 3, title: '👀 Follow-up (Sumido)', text: 'Olá [Nome], ainda está buscando imóveis na região? Chegou uma nova opção que combina com seu perfil.' },
    { id: 4, title: '💰 Proposta', text: 'Olá [Nome], consegui uma condição especial para o [Imóvel]. Quando consegue falar?' },
];

const LOSS_REASONS = [
    "Preço alto / Fora do orçamento",
    "Localização não atendeu",
    "Comprou com concorrente",
    "Desistiu da compra",
    "Não responde / Contato errado",
    "Reprovado no Financiamento",
    "Outro"
];

// Pipedrive-style Activity Helper
const getActivityStatus = (tasks: Task[]): 'overdue' | 'today' | 'future' | 'none' => {
    const pending = tasks?.filter(t => !t.completed);
    if (!pending || pending.length === 0) return 'none';

    const today = new Date().toISOString().split('T')[0];
    const nextTask = pending.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

    if (nextTask.dueDate < today) return 'overdue';
    if (nextTask.dueDate === today) return 'today';
    return 'future';
};

const getNextTaskInfo = (tasks: Task[]) => {
    const pending = tasks?.filter(t => !t.completed);
    if (!pending || pending.length === 0) return null;
    return pending.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
};

interface LeadColumnProps {
    status: string; // Changed from LeadStatus to string to support dynamic pipelines
    title: string;
    color: string;
    leads: Lead[];
    index: number;
    onDrop: (status: string) => void;
    onDragStart: (id: string) => void;
    onLeadClick: (lead: Lead) => void;
    moveColumn: (dragIndex: number, hoverIndex: number) => void;
    // Grouping Props
    isGroupingMode: boolean;
    selectionIndex?: number;
    onColumnSelect: (id: string) => void;
    // Delete/Edit Prop
    onRemoveStage: (id: string) => void;
    onEditStage: (id: string) => void;
    // NEW: Permission prop
    canDelete: boolean;
}

const LeadCard: React.FC<{ lead: Lead, compact?: boolean, onDragStart?: (id: string) => void, onClick?: () => void }> = ({ lead, compact, onDragStart, onClick }) => {
    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'instagram': return <Instagram className="w-3 h-3 text-pink-600" />;
            case 'whatsapp': return <MessageCircle className="w-3 h-3 text-green-600" />;
            default: return <Globe className="w-3 h-3 text-blue-600" />;
        }
    };

    const handleDragStart = (e: React.DragEvent) => {
        if (onDragStart) {
            e.stopPropagation(); // Impede que o evento suba para a coluna
            onDragStart(lead.id);
            if (e.dataTransfer) {
                e.dataTransfer.setData('type', 'LEAD'); // Identifica que é um card
                e.dataTransfer.effectAllowed = "move";
            }
        }
    };

    // Pipedrive Activity Logic
    const activityStatus = getActivityStatus(lead.tasks);
    const nextTask = getNextTaskInfo(lead.tasks);

    // Days in Stage Calculation (Mocked via lastInteraction)
    const getDaysInStage = () => {
        const lastDate = new Date(lead.lastInteraction || lead.createdAt);
        const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const daysInStage = getDaysInStage();
    const isStagnant = daysInStage > 5;

    // Get Assigned Agent Avatar
    const agent = MOCK_USERS.find(u => u.id === lead.assignedTo);

    return (
        <div
            draggable={!compact}
            onDragStart={handleDragStart}
            onClick={onClick}
            className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all group ${compact ? 'p-3 flex items-center justify-between border-gray-200 w-full' : 'p-3 cursor-pointer active:cursor-grabbing hover:border-brand-400'} ${!compact && isStagnant ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-transparent'} `}
        >
            <div className={compact ? 'flex items-center gap-3 w-full' : ''}>
                <div className="flex justify-between items-start mb-2 w-full">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-sm truncate max-w-[150px]">{lead.name}</h4>
                            {/* Temperature Icons */}
                            {lead.temperature === 'hot' && <Flame className="w-3 h-3 text-red-500 fill-red-500" />}
                            {lead.temperature === 'cold' && <Snowflake className="w-3 h-3 text-blue-300" />}
                        </div>
                        {compact ? (
                            <div className="text-xs text-gray-500 truncate max-w-[200px] flex items-center gap-2">
                                <span className="font-bold text-brand-600">{lead.interest}</span>
                                <span>•</span>
                                <span>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                        ) : (
                            <p className="text-[0.625rem] text-gray-500 mt-0.5 truncate max-w-[180px]">{lead.interest}</p>
                        )}
                    </div>

                    {/* Agent Avatar or Activity */}
                    {!compact && (
                        <div className="ml-2 flex-shrink-0 flex items-center gap-1">
                            {agent && (
                                <img src={agent.avatar} title={`Responsável: ${agent.name} `} className="w-5 h-5 rounded-full border border-gray-200" alt="" />
                            )}
                            {activityStatus === 'overdue' && <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm" title="Atividade Atrasada"><Clock className="w-3 h-3" /></div>}
                            {activityStatus === 'today' && <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm" title="Para Hoje"><Calendar className="w-3 h-3" /></div>}
                            {activityStatus === 'future' && <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center" title="Agendado"><ChevronRight className="w-3.5 h-3.5" /></div>}
                            {activityStatus === 'none' && <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-500 border border-amber-200 flex items-center justify-center animate-pulse" title="Sem atividade agendada!"><AlertTriangle className="w-3 h-3" /></div>}
                        </div>
                    )}
                </div>
            </div>

            {!compact && (
                <>
                    {/* Next Action Text (Focus of the Day) */}
                    {nextTask ? (
                        <div className={`mt-2 text-[0.625rem] flex items-center gap-1.5 px-2 py-1.5 rounded border ${activityStatus === 'overdue' ? 'bg-red-50 border-red-100 text-red-700' :
                            activityStatus === 'today' ? 'bg-green-50 border-green-100 text-green-700' :
                                'bg-gray-50 border-gray-100 text-gray-500'
                            } `}>
                            {nextTask.type === 'call' && <Phone className="w-2.5 h-2.5" />}
                            {nextTask.type === 'meeting' && <User className="w-2.5 h-2.5" />}
                            {nextTask.type === 'visit' && <MapPin className="w-2.5 h-2.5" />}
                            {nextTask.type === 'email' && <Mail className="w-2.5 h-2.5" />}
                            {nextTask.type === 'whatsapp' && <MessageCircle className="w-2.5 h-2.5" />}
                            <span className="truncate font-bold">{nextTask.title}</span>
                            <span className="ml-auto opacity-70">
                                {new Date(nextTask.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                        </div>
                    ) : (
                        <div className="mt-2 text-[0.625rem] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Sem próxima ação</span>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-50">
                        {lead.value && (
                            <div className="text-[0.625rem] font-bold text-gray-700">
                                {lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        )}
                        <div className="ml-auto text-[0.625rem] text-gray-400 flex items-center gap-2">
                            <span title="Dias no estágio" className={`${isStagnant ? 'text-red-500 font-bold' : ''} `}>{daysInStage}d</span>
                            {getSourceIcon(lead.source)}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const LeadColumn: React.FC<LeadColumnProps> = ({ status, title, color, leads, index, onDrop, onDragStart, onLeadClick, moveColumn, isGroupingMode, selectionIndex, onColumnSelect, onRemoveStage, onEditStage, canDelete }) => {
    const columnLeads = leads.filter(l => l.status === status);
    // Calculate column total value
    const totalValue = columnLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);

    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);

        if (!e.dataTransfer) return;
        const dragType = e.dataTransfer.getData('type');

        // Se for uma coluna sendo arrastada
        if (dragType === 'COLUMN') {
            const dragIndex = Number(e.dataTransfer.getData('index'));
            if (!isNaN(dragIndex) && dragIndex !== index) {
                moveColumn(dragIndex, index);
            }
            return;
        }

        // Se for um lead sendo arrastado
        if (dragType === 'LEAD') {
            onDrop(status);
        }
    };

    const handleColumnDragStart = (e: React.DragEvent) => {
        // Disable dragging if in grouping mode
        if (isGroupingMode) {
            e.preventDefault();
            return;
        }
        if (e.dataTransfer) {
            e.dataTransfer.setData('type', 'COLUMN');
            e.dataTransfer.setData('index', index.toString());
            e.dataTransfer.effectAllowed = 'move';
        }
    };

    return (
        <div
            draggable={!isGroupingMode} // Permite arrastar a coluna apenas se não estiver agrupando
            onDragStart={handleColumnDragStart}
            className={`flex-shrink-0 w-80 rounded-xl bg-gray-100 flex flex-col max-h-full border transition-all duration-200 group
            ${isOver && !isGroupingMode ? 'bg-gray-200 border-gray-300 ring-2 ring-brand-200' : 'border-gray-200'}
            ${isGroupingMode ? 'cursor-pointer hover:bg-gray-200' : 'cursor-grab active:cursor-grabbing'}
            ${selectionIndex !== undefined ? 'ring-2 ring-brand-600 bg-brand-50/50' : ''}
`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
                if (isGroupingMode) {
                    onColumnSelect(status);
                }
            }}
        >
            <div className={`p-3 border-b-2 flex flex-col relative ${color} `}>
                {/* Selection Badge for Grouping Mode */}
                {isGroupingMode && selectionIndex !== undefined && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md animate-bounce">
                        {selectionIndex + 1}
                    </div>
                )}

                {/* Actions Buttons - Only visible on hover and if not grouping */}
                {!isGroupingMode && (
                    <div
                        className="absolute top-2 right-2 flex gap-1 z-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        // IMPORTANT: Stop propagation on the container to prevent any mouse event from reaching the draggable parent
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onEditStage(status);
                            }}
                            onMouseDown={(e) => e.stopPropagation()} // REDUNDANT BUT SAFE: Prevents drag start
                            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors cursor-pointer"
                            title="Editar Etapa"
                        >
                            <Settings className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onRemoveStage(status);
                                }}
                                onMouseDown={(e) => e.stopPropagation()} // REDUNDANT BUT SAFE: Prevents drag start
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="Remover Etapa"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}

                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide select-none truncate max-w-[150px]" title={title}>{title}</h3>
                    </div>
                    <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{columnLeads.length}</span>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                    {totalValue > 0 ? totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0'}
                </div>
            </div>

            <div className={`p-2 space-y-2 overflow-y-auto flex-1 custom-scrollbar min-h-[100px] ${isGroupingMode ? 'opacity-50 pointer-events-none' : ''} `}>
                {columnLeads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} onDragStart={onDragStart} onClick={() => onLeadClick(lead)} />
                ))}
                {columnLeads.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 py-8 pointer-events-none">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-2">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-xs">Arraste aqui</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Pipeline Editor Modal ---
const PipelineEditorModal: React.FC<{ onClose: () => void, onSave: (pipeline: Pipeline) => void }> = ({ onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [stages, setStages] = useState<{ title: string, color: string }[]>([]); // Starts empty

    const handleAddStage = () => {
        setStages([...stages, { title: 'Nova Etapa', color: 'border-gray-400' }]);
    };

    const handleRemoveStage = (index: number) => {
        setStages(stages.filter((_, i) => i !== index));
    };

    const handleStageChange = (index: number, field: string, value: string) => {
        const newStages = [...stages];
        (newStages[index] as any)[field] = value;
        setStages(newStages);
    };

    const handleSave = () => {
        if (!title) return alert('Nome do funil é obrigatório');
        const newPipeline: Pipeline = {
            id: `pipe_${Date.now()} `,
            title,
            isDefault: false,
            // Custom pipelines are always deletable by default
            stages: stages.map(s => ({
                id: s.title.toUpperCase().replace(/\s+/g, '_') + '_' + Date.now(),
                title: s.title,
                color: s.color
            })),
            groups: []
        };
        onSave(newPipeline);
    };

    return (
        <div className="absolute inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900">Novo Funil de Vendas</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Funil</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="Ex: Funil de Aluguéis, Lançamentos..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-bold text-gray-700">Etapas do Funil</label>
                            <button onClick={handleAddStage} className="text-brand-600 text-xs font-bold hover:underline flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5" /> Adicionar Etapa
                            </button>
                        </div>
                        {stages.length === 0 && (
                            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg text-sm">
                                Nenhuma etapa criada. Adicione etapas para montar seu funil.
                            </div>
                        )}
                        <div className="space-y-3">
                            {stages.map((stage, idx) => (
                                <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-200 group">
                                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                    <input
                                        type="text"
                                        value={stage.title}
                                        onChange={e => handleStageChange(idx, 'title', e.target.value)}
                                        className="flex-1 bg-transparent text-sm font-medium outline-none border-b border-transparent focus:border-brand-300"
                                        placeholder="Nome da etapa"
                                    />
                                    <select
                                        value={stage.color}
                                        onChange={e => handleStageChange(idx, 'color', e.target.value)}
                                        className="text-xs bg-white border border-gray-200 rounded px-1 py-1"
                                    >
                                        <option value="border-blue-400">Azul</option>
                                        <option value="border-green-500">Verde</option>
                                        <option value="border-purple-500">Roxo</option>
                                        <option value="border-amber-500">Amarelo</option>
                                        <option value="border-red-500">Vermelho</option>
                                        <option value="border-gray-400">Cinza</option>
                                    </select>
                                    <button onClick={() => handleRemoveStage(idx)} className="text-gray-400 hover:text-red-500 p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg">Cancelar</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-md">Criar Funil</button>
                </div>
            </div>
        </div>
    );
};

// --- Stage Editor Modal ---
const StageEditorModal: React.FC<{
    onClose: () => void,
    onSave: (name: string, color: string) => void,
    initialData?: { name: string, color: string }
}> = ({ onClose, onSave, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    // Colors mapping to full style classes (Border + Background tint for header)
    const colors = [
        { label: 'Azul', value: 'border-blue-400 bg-blue-50/50' },
        { label: 'Verde', value: 'border-green-500 bg-green-50/50' },
        { label: 'Roxo', value: 'border-purple-500 bg-purple-50/50' },
        { label: 'Amarelo', value: 'border-amber-500 bg-amber-50/50' },
        { label: 'Vermelho', value: 'border-red-500 bg-red-50/50' },
        { label: 'Cinza', value: 'border-gray-400 bg-gray-50/50' },
        { label: 'Cyan', value: 'border-cyan-500 bg-cyan-50/50' },
        { label: 'Rosa', value: 'border-pink-500 bg-pink-50/50' },
    ];
    const [selectedColor, setSelectedColor] = useState(initialData?.color || colors[5].value);

    return (
        <div className="absolute inset-0 z-[60] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {initialData ? <><Settings className="w-5 h-5 text-brand-600" /> Editar Pipeline</> : <><Plus className="w-5 h-5 text-brand-600" /> Nova Pipeline</>}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="Ex: Qualificação, Visita..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Cor da Etapa</label>
                        <div className="grid grid-cols-4 gap-2">
                            {colors.map(c => {
                                // Extract bg color class for preview
                                const bgClass = c.value.split(' ').find(cls => cls.startsWith('bg-'))?.replace('/50', '') || 'bg-gray-200';
                                const borderClass = c.value.split(' ').find(cls => cls.startsWith('border-')) || 'border-gray-400';

                                return (
                                    <button
                                        key={c.value}
                                        onClick={() => setSelectedColor(c.value)}
                                        className={`h-8 rounded-lg border-2 transition-all ${selectedColor === c.value ? 'border-gray-900 scale-105 shadow-sm' : 'border-transparent hover:scale-105'} `}
                                    >
                                        <div className={`w-full h-full rounded border ${bgClass} ${borderClass} `}></div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
                    <button
                        onClick={() => {
                            if (!name) return alert("Digite um nome para a pipeline");
                            onSave(name, selectedColor);
                        }}
                        className="flex-1 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 shadow-md"
                    >
                        {initialData ? 'Salvar' : 'Criar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Group Editor Modal ---
const GroupEditorModal: React.FC<{
    onClose: () => void,
    onSave: (name: string, color: string) => void
}> = ({ onClose, onSave }) => {
    const [groupName, setGroupName] = useState('');
    const [groupColor, setGroupColor] = useState('#3b82f6'); // Default Blue

    return (
        <div className="absolute inset-0 z-[60] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-brand-600" /> Criar Grupo
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Grupo</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="Ex: Fechamento, Prospecção..."
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Palette className="w-4 h-4" /> Cor do Agrupamento
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899', '#6b7280'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setGroupColor(color)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${groupColor === color ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'} `}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
                    <button
                        onClick={() => {
                            if (!groupName) return alert("Digite um nome para o grupo");
                            onSave(groupName, groupColor);
                        }}
                        className="flex-1 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 shadow-md"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProfileSection: React.FC<{ title: string, icon: any, isOpen: boolean, toggle: () => void, children: React.ReactNode }> = ({ title, icon: Icon, isOpen, toggle, children }) => (
    <div className="bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden">
        <button type="button" onClick={toggle} aria-expanded={isOpen} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
                <Icon className="text-gray-500 w-[18px] h-[18px]" />
                <span className="font-bold text-gray-700 text-sm">{title}</span>
            </div>
            {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {isOpen && (
            <div className="p-4">
                {children}
            </div>
        )}
    </div>
);

const FormInput: React.FC<{ label: string, value?: string | number, onChange?: (val: string) => void, type?: string, placeholder?: string, required?: boolean, readOnly?: boolean }> = ({ label, value, onChange, type = "text", placeholder, required, readOnly }) => (
    <div className="mb-3">
        <label className="block text-xs font-bold text-gray-500 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            value={value ?? ''}
            onChange={e => onChange && onChange(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:border-brand-500'} `}
        />
    </div>
);

const FormSelect: React.FC<{ label: string, value: string | undefined, options: { label: string, value: string }[], onChange?: (val: string) => void }> = ({ label, value, options, onChange }) => (
    <div className="mb-3">
        <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
        <select
            value={value ?? ''}
            onChange={e => onChange && onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:border-brand-500 outline-none bg-white"
        >
            <option value="">Selecione...</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

// --- Lead Detail Modal ---

type ActiveProfileTab = 'WA' | 'SF' | 'PD' | 'RD' | 'MASTER';

type ProfileSections = {
    master_general: boolean;
    master_address: boolean;
    master_commercial: boolean;
    master_company: boolean;
    master_interest: boolean;
    master_property: boolean;
    master_deal: boolean;
    master_proposal: boolean;
    master_docs: boolean;
    master_communication: boolean;
    master_timeline: boolean;
    master_products: boolean;
    master_financial: boolean;
    master_projects: boolean;
    master_custom: boolean;
    rd_main: boolean;
    rd_qual: boolean;
    rd_personal: boolean;
    rd_company: boolean;
    rd_opportunity: boolean;
    rd_history: boolean;
    rd_custom: boolean;
    pd_summary: boolean;
    pd_source: boolean;
    pd_person: boolean;
    pd_org: boolean;
    pd_product: boolean;
    pd_overview: boolean;
    pd_participants: boolean;
    pd_details: boolean;
    pd_cco: boolean;
    pd_projects: boolean;
    sf_about: boolean;
    sf_contact: boolean;
    sf_segment: boolean;
    wa_personal: boolean;
    wa_address: boolean;
    wa_lead_info: boolean;
    wa_products: boolean;
};

type QuickActionType = 'email' | 'meeting' | 'call' | 'task' | 'whatsapp' | null;

const LeadDetailModal: React.FC<{
    lead: Lead,
    pipeline: Pipeline,
    onClose: () => void,
    onUpdate: (updated: Lead) => void,
    isFullScreen?: boolean,
    crmSettings: CRMSettings,
    setAutomationModalOpen: (isOpen: boolean) => void
}> = ({ lead, pipeline, onClose, onUpdate, isFullScreen = false, crmSettings, setAutomationModalOpen }) => {
    const [localLead, setLocalLead] = useState(lead);
    const [activeMainTab, setActiveMainTab] = useState<'activity' | 'notes' | 'profile' | 'files'>('activity');
    const [activeProfile, setActiveProfile] = useState<ActiveProfileTab>(() => {
        return crmSettings?.defaultProfile || 'MASTER';
    });
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
    const [isFullScreenLocal, setIsFullScreenLocal] = useState(isFullScreen);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Enforce valid active profile
    useEffect(() => {
        if (!crmSettings) return;

        let isValid = false;
        if (activeProfile === 'MASTER' && crmSettings.enableProfileMaster) isValid = true;
        if (activeProfile === 'WA' && crmSettings.enableProfileWA) isValid = true;
        if (activeProfile === 'SF' && crmSettings.enableProfileSF) isValid = true;
        if (activeProfile === 'PD' && crmSettings.enableProfilePD) isValid = true;
        if (activeProfile === 'RD' && crmSettings.enableProfileRD) isValid = true;

        if (!isValid) {
            // Fallback strategy: Default -> First Available -> Master
            if (crmSettings.defaultProfile && crmSettings[`enableProfile${crmSettings.defaultProfile === 'WA' ? 'WA' : crmSettings.defaultProfile === 'SF' ? 'SF' : crmSettings.defaultProfile === 'PD' ? 'PD' : crmSettings.defaultProfile === 'RD' ? 'RD' : 'Master'}`]) {
                setActiveProfile(crmSettings.defaultProfile);
            } else if (crmSettings.enableProfileMaster) {
                setActiveProfile('MASTER');
            } else if (crmSettings.enableProfileWA) {
                setActiveProfile('WA');
            } else if (crmSettings.enableProfileSF) {
                setActiveProfile('SF');
            } else if (crmSettings.enableProfilePD) {
                setActiveProfile('PD');
            } else if (crmSettings.enableProfileRD) {
                setActiveProfile('RD');
            }
        }
    }, [crmSettings, activeProfile]);

    const [activeActionTab, setActiveActionTab] = useState<'schedule' | 'whatsapp'>('schedule');
    const [quickNote, setQuickNote] = useState('');
    const [actionType, setActionType] = useState<ActivityType>('call');
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
    const [whatsappMessage, setWhatsappMessage] = useState('');
    const [activeQuickAction, setActiveQuickAction] = useState<QuickActionType>(null);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [noteTitle, setNoteTitle] = useState('');
    const [noteBody, setNoteBody] = useState('');
    const [properties, setProperties] = useState<Property[]>([]);
    const [showPropertyPicker, setShowPropertyPicker] = useState(false);
    const [propertySearch, setPropertySearch] = useState('');
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [profileSections, setProfileSections] = useState<ProfileSections>({
        master_general: true,
        master_address: true,
        master_commercial: true,
        master_company: true,
        master_interest: true,
        master_property: true,
        master_deal: true,
        master_proposal: true,
        master_docs: true,
        master_communication: true,
        master_timeline: true,
        master_products: true,
        master_financial: true,
        master_projects: true,
        master_custom: true,
        rd_main: true,
        rd_qual: true,
        rd_personal: true,
        rd_company: true,
        rd_opportunity: true,
        rd_history: true,
        rd_custom: true,
        pd_summary: true,
        pd_source: true,
        pd_person: true,
        pd_org: true,
        pd_product: true,
        pd_overview: true,
        pd_participants: true,
        pd_details: true,
        pd_cco: true,
        pd_projects: true,
        sf_about: true,
        sf_contact: true,
        sf_segment: true,
        wa_personal: true,
        wa_address: true,
        wa_lead_info: true,
        wa_products: true,
    });

    const currentFunnelPhase = getCurrentFunnelPhase(localLead.status);
    const currentStepIndex = pipeline.stages.findIndex(s => s.id === localLead.status);

    useEffect(() => {
        setLocalLead(lead);
    }, [lead]);

    useEffect(() => {
        setIsFullScreenLocal(isFullScreen);
    }, [isFullScreen]);

    useEffect(() => {
        let isMounted = true;
        api.properties.getAll({ includeUnpublished: true }).then(data => {
            if (isMounted) {
                setProperties(data);
            }
        });
        return () => {
            isMounted = false;
        };
    }, []);

    const systemLogs = [
        { type: 'system_log', content: { title: 'Lead Criado' }, date: localLead.createdAt, id: 'sys1' },
        { type: 'system_log', content: { title: 'Status alterado para ' + localLead.status }, date: localLead.lastInteraction || localLead.createdAt, id: 'sys2' }
    ];

    const timelineItems = [
        ...(localLead.notes?.map((n, i) => ({ type: 'note', content: n, date: localLead.createdAt, id: `n${i} ` })) || []),
        ...(localLead.tasks?.map(t => ({ type: 'task', content: t, date: t.createdAt || localLead.createdAt, id: t.id })) || []),
        ...systemLogs
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // GED do Lead (Documentos)
    const documents = (localLead.documents ?? []).slice().sort(
        (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    const totalDocuments = documents.length;

    const lastUploadLabel =
        totalDocuments > 0
            ? new Date(documents[0].uploadedAt).toLocaleString('pt-BR')
            : null;



    const getDocumentTypeLabel = (type: 'pdf' | 'image' | 'doc') => {
        if (type === 'pdf') return 'PDF';
        if (type === 'image') return 'Imagem';
        return 'Documento';
    };

    const realEstatePropertyBySiteId = useMemo(() => {
        const entries = realEstatePropertiesMock
            .filter(item => item.sitePropertyId)
            .map(item => [String(item.sitePropertyId), item] as [string, typeof item]);
        return new Map(entries);
    }, []);

    const leadInterestText = (localLead.interest || '').toLowerCase().trim();
    const leadNotesText = (localLead.notes || []).join(' ').toLowerCase();
    const leadReferenceText = [
        leadInterestText,
        leadNotesText,
        localLead.enrichedData?.location,
        localLead.enrichedData?.propertyId,
        localLead.enrichedData?.propertyCode,
        localLead.enrichedData?.propertyLink,
        localLead.enrichedData?.propertyAddress,
        localLead.address?.street,
        localLead.address?.number,
        localLead.address?.city,
        localLead.address?.state
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    const extractPropertyIdsFromText = (text: string) => {
        const ids = new Set<string>();
        if (!text) return ids;
        const patterns = [
            /properties\/([a-z0-9-]+)/gi,
            /imoveis\/([a-z0-9-]+)/gi,
            /imovel\s*#?([a-z0-9-]+)/gi,
            /codigo\s*:?\s*([a-z0-9-]+)/gi
        ];
        patterns.forEach(pattern => {
            let match = pattern.exec(text);
            while (match) {
                if (match[1]) {
                    ids.add(match[1]);
                }
                match = pattern.exec(text);
            }
        });
        return ids;
    };

    const propertyIdsFromLinks = extractPropertyIdsFromText(leadReferenceText);
    const propertyIdsFromCodes = realEstatePropertiesMock
        .filter(item => item.codigo && leadReferenceText.includes(item.codigo.toLowerCase()))
        .map(item => item.sitePropertyId)
        .filter((id): id is string => Boolean(id))
        .map(id => String(id));

    const manualLinkedPropertyIds = localLead.linkedPropertyIds ?? [];
    const ignoredPropertyIds = localLead.ignoredPropertyIds ?? [];
    const ignoredPropertyIdSet = new Set(ignoredPropertyIds);
    const autoLinkedPropertyIds = properties
        .filter(property => {
            const title = property.title?.toLowerCase() ?? '';
            const address = property.address?.toLowerCase() ?? '';
            const id = property.id?.toLowerCase() ?? '';
            const interestMatch =
                leadInterestText.length > 3 &&
                (title.includes(leadInterestText) || leadInterestText.includes(title));
            const referenceMatch =
                leadReferenceText &&
                ((title && leadReferenceText.includes(title)) ||
                    (address && leadReferenceText.includes(address)) ||
                    (id && leadReferenceText.includes(id)));
            const linkMatch = propertyIdsFromLinks.has(property.id) || propertyIdsFromCodes.includes(property.id);
            if (ignoredPropertyIdSet.has(property.id)) return false;
            return interestMatch || referenceMatch || linkMatch;
        })
        .map(property => property.id);

    const linkedPropertyIds = Array.from(new Set([...manualLinkedPropertyIds, ...autoLinkedPropertyIds]))
        .filter(id => !ignoredPropertyIdSet.has(id));
    const linkedProperties = properties.filter(property => linkedPropertyIds.includes(property.id));

    const filteredPropertyOptions = properties.filter(property => {
        const query = propertySearch.trim().toLowerCase();
        if (!query) return true;
        const title = property.title?.toLowerCase() ?? '';
        const address = property.address?.toLowerCase() ?? '';
        const id = property.id?.toLowerCase() ?? '';
        return title.includes(query) || address.includes(query) || id.includes(query);
    }).filter(property => !linkedPropertyIds.includes(property.id));


    const handleAddActivity = (e: React.FormEvent) => {
        e.preventDefault();
        const newTask: Task = {
            id: `t${Date.now()} `,
            title: taskTitle || `Nova ${actionType} `,
            dueDate: taskDate,
            completed: false,
            type: actionType,
            notes: quickNote,
            createdAt: new Date().toISOString()
        };
        const updatedLead = { ...localLead, tasks: [newTask, ...(localLead.tasks || [])], lastInteraction: new Date().toISOString() };
        setLocalLead(updatedLead);
        onUpdate(updatedLead);
        setTaskTitle('');
        setQuickNote('');
    };

    const addQuickActivity = (newTask: Task) => {
        const updatedLead = { ...localLead, tasks: [newTask, ...(localLead.tasks || [])], lastInteraction: new Date().toISOString() };
        setLocalLead(updatedLead);
        onUpdate(updatedLead);
    };

    const toggleQuickAction = (action: QuickActionType) => {
        setActiveQuickAction(prev => (prev === action ? null : action));
    };

    const handleQuickShortcut = (action: 'meeting' | 'call' | 'task' | 'whatsapp') => {
        if (activeQuickAction === action) {
            setActiveQuickAction(null);
            return;
        }
        if (action === 'whatsapp') {
            setActiveActionTab('whatsapp');
        } else {
            setActiveActionTab('schedule');
            if (action === 'meeting' || action === 'call') {
                setActionType(action);
            }
        }
        setActiveQuickAction(action);
    };

    const handleQuickEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const subject = emailSubject.trim();
        const body = emailBody.trim();
        if (!subject && !body) return;
        // TODO: Integrar envio de e-mail via SMTP/Google/Microsoft.
        const newTask: Task = {
            id: `t${Date.now()} `,
            title: subject ? `E - mail enviado: ${subject} ` : 'E-mail enviado',
            dueDate: new Date().toISOString().split('T')[0],
            completed: true,
            type: 'email',
            notes: body ? body.slice(0, 240) : undefined,
            createdAt: new Date().toISOString()
        };
        addQuickActivity(newTask);
        setEmailSubject('');
        setEmailBody('');
        setActiveQuickAction(null);
    };

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        const title = noteTitle.trim();
        const body = noteBody.trim();
        if (!title && !body) return;
        const noteText = title && body ? `${title}: ${body} ` : (title || body);
        const updatedLead = { ...localLead, notes: [noteText, ...(localLead.notes || [])], lastInteraction: new Date().toISOString() };
        setLocalLead(updatedLead);
        onUpdate(updatedLead);
        setNoteTitle('');
        setNoteBody('');
    };

    const handleAddLinkedProperty = () => {
        if (!selectedPropertyId) return;
        const current = new Set(localLead.linkedPropertyIds ?? []);
        current.add(selectedPropertyId);
        const nextIgnored = (localLead.ignoredPropertyIds ?? []).filter(id => id !== selectedPropertyId);
        const updatedLead = {
            ...localLead,
            linkedPropertyIds: Array.from(current),
            ignoredPropertyIds: nextIgnored
        };
        setLocalLead(updatedLead);
        onUpdate(updatedLead);
        setSelectedPropertyId('');
        setPropertySearch('');
        setShowPropertyPicker(false);
    };

    const handleUnlinkProperty = (propertyId: string) => {
        const nextLinked = (localLead.linkedPropertyIds ?? []).filter(id => id !== propertyId);
        const nextIgnored = new Set(localLead.ignoredPropertyIds ?? []);
        nextIgnored.add(propertyId);
        const updatedLead = {
            ...localLead,
            linkedPropertyIds: nextLinked,
            ignoredPropertyIds: Array.from(nextIgnored)
        };
        setLocalLead(updatedLead);
        onUpdate(updatedLead);
    };

    const getPropertyStatusLabel = (status: Property['status']) => {
        if (status === 'sold') return 'Vendido';
        if (status === 'rented') return 'Alugado';
        return 'Ativo';
    };

    const getPropertyMainValue = (property: Property) => {
        if (property.businessType === 'RENT' && property.rentPrice) {
            return { label: 'Aluguel', value: property.rentPrice };
        }
        if (property.businessType === 'BOTH' && property.price) {
            return { label: 'Venda', value: property.price };
        }
        if (property.price) return { label: 'Venda', value: property.price };
        if (property.rentPrice) return { label: 'Aluguel', value: property.rentPrice };
        return { label: 'Valor', value: 0 };
    };

    const getCommissionEstimate = (property: Property) => {
        const { label, value } = getPropertyMainValue(property);
        if (!value) return null;
        const rate = label === 'Aluguel' ? 0.1 : 0.05;
        return { rate, value: value * rate, label };
    };

    const getFloorFromUnit = (unit?: string) => {
        if (!unit) return null;
        const match = unit.match(/\d+/);
        if (!match) return null;
        const digits = match[0];
        if (digits.length <= 2) return digits;
        return digits.slice(0, digits.length - 2);
    };

    const markTaskDone = (taskId: string) => {
        const updatedTasks = localLead.tasks?.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        const updatedLead = { ...localLead, tasks: updatedTasks };
        setLocalLead(updatedLead);
        onUpdate(updatedLead);
    };

    const applyWhatsAppTemplate = (template: string) => {
        let msg = template;
        msg = msg.replace('[Nome]', localLead.name.split(' ')[0]);
        msg = msg.replace('[Imóvel]', localLead.interest || 'imóvel');
        msg = msg.replace('[Seu Nome]', 'Eduardo');
        setWhatsappMessage(msg);
    };

    const handleSendWhatsApp = () => {
        if (!localLead.phone) return;
        const phone = localLead.phone.replace(/\D/g, '');
        const encoded = encodeURIComponent(whatsappMessage);
        window.open(`https://wa.me/55${phone}?text=${encoded}`, '_blank');
        const newTask: Task = {
            id: `t${Date.now()}`,
            title: 'Mensagem WhatsApp enviada',
            dueDate: new Date().toISOString().split('T')[0],
            completed: true,
            type: 'whatsapp',
            notes: whatsappMessage,
            createdAt: new Date().toISOString()
        };
        const updatedLead = { ...localLead, tasks: [newTask, ...(localLead.tasks || [])], lastInteraction: new Date().toISOString() };
        setLocalLead(updatedLead);
        onUpdate(updatedLead);
        setWhatsappMessage('');
    };

    const handleUploadDocuments = async (files: File[]) => {
        if (!files.length) return;
        try {
            const uploadPromises = files.map(file => api.leads.uploadDocument(localLead.id, file));
            const newDocuments = await Promise.all(uploadPromises);

            const validDocuments = newDocuments.map(doc => ({
                ...doc,
                type: (['pdf', 'image', 'doc'].includes(doc.type) ? doc.type : 'doc') as 'pdf' | 'image' | 'doc'
            }));

            const updatedLead = {
                ...localLead,
                documents: [...(localLead.documents || []), ...validDocuments]
            };

            setLocalLead(updatedLead);
            onUpdate(updatedLead);
        } catch (error) {
            console.error('Erro ao enviar documentos:', error);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files || []);
        handleUploadDocuments(droppedFiles);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        handleUploadDocuments(selectedFiles);
        e.target.value = '';
    };

    const handleScriptCheck = (question: string, checked: boolean) => {
        const updatedScriptData = { ...(localLead.scriptData || {}), [question]: checked };
        const updatedLead = { ...localLead, scriptData: updatedScriptData };
        setLocalLead(updatedLead);
        onUpdate(updatedLead);
    };

    const updateProfile = (section: string, field: string, value: any) => {
        setLocalLead(prev => ({ ...prev, [section]: { ...(prev as any)[section], [field]: value } }));
    };

    // Helper for SF Data
    const updateSFData = (field: string, value: any) => {
        // Storing SF specific data in enrichedData or a new property if types allowed, 
        // using enrichedData for now to avoid breaking types.
        setLocalLead(prev => ({
            ...prev,
            enrichedData: {
                ...(prev.enrichedData || {}),
                [field]: value
            }
        }));
    };

    // Get Assigned Agent Name
    const assignedAgent = MOCK_USERS.find(u => u.id === localLead.assignedTo);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'call': return <Phone size={14} />;
            case 'email': return <Mail size={14} />;
            case 'meeting': return <User size={14} />;
            case 'visit': return <MapPin size={14} />;
            case 'whatsapp': return <MessageCircle size={14} />;
            default: return <CheckCircle size={14} />;
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = 250;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    const handleStageClick = (stageId: string) => {
        // Optimistic UI Update
        const updatedLead = { ...localLead, status: stageId as any };
        setLocalLead(updatedLead);

        // Propagate changes
        onUpdate(updatedLead);

        // Persist change
        api.leads.updateStatus(updatedLead.id, stageId as any);
    };

    // Helper to calculate deal age in days
    const calculateDealAge = () => {
        const created = new Date(localLead.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - created.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} dias`;
    };

    const clampScore = (value: number) => Math.max(0, Math.min(100, value));
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    const tasks = localLead.tasks || [];
    const pendingTasks = tasks.filter(t => !t.completed);
    const overdueTasks = pendingTasks.filter(t => new Date(t.dueDate) < new Date(todayIso));
    const nextTask = getNextTaskInfo(tasks);

    const getSuggestedAction = (status: LeadStatus) => {
        switch (status) {
            case LeadStatus.NEW:
            case LeadStatus.TRIAGE:
                return 'Fazer primeiro contato';
            case LeadStatus.QUALIFIED:
                return 'Agendar visita';
            case LeadStatus.VISIT_SCHEDULED:
                return 'Confirmar visita';
            case LeadStatus.PROPOSAL:
                return 'Enviar follow-up da proposta';
            case LeadStatus.NEGOTIATION:
                return 'Reforcar negociacao';
            case LeadStatus.CLOSED:
                return 'Coletar documentos finais';
            case LeadStatus.LOST:
            case LeadStatus.DISQUALIFIED:
                return 'Registrar motivo e encerrar';
            default:
                return 'Registrar proxima acao';
        }
    };

    const interactionDates = [
        localLead.lastInteraction,
        localLead.createdAt,
        ...(tasks.map(t => t.createdAt))
    ].filter(Boolean) as string[];
    const lastInteractionDate = interactionDates.reduce<Date | null>((latest, dateStr) => {
        const date = new Date(dateStr);
        if (!latest || date > latest) return date;
        return latest;
    }, null);
    const daysSinceInteraction = lastInteractionDate
        ? Math.floor((today.getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const lastInteractionLabel = lastInteractionDate
        ? lastInteractionDate.toLocaleString('pt-BR')
        : 'Sem registro';
    const suggestedAction = nextTask
        ? `Proxima tarefa: ${nextTask.title}`
        : getSuggestedAction(localLead.status);

    const riskAlerts: { id: string; label: string; severity: 'high' | 'medium' | 'low' }[] = [];
    if (daysSinceInteraction !== null && daysSinceInteraction >= 7) {
        riskAlerts.push({
            id: 'no-interaction',
            label: `Sem interacao ha ${daysSinceInteraction} dias`,
            severity: daysSinceInteraction >= 14 ? 'high' : 'medium'
        });
    }
    if (overdueTasks.length > 0) {
        riskAlerts.push({
            id: 'overdue-tasks',
            label: `Tarefas atrasadas (${overdueTasks.length})`,
            severity: 'high'
        });
    }
    if (localLead.status === LeadStatus.PROPOSAL) {
        if (daysSinceInteraction !== null && daysSinceInteraction >= 5) {
            riskAlerts.push({
                id: 'proposal-no-response',
                label: `Proposta sem retorno ha ${daysSinceInteraction} dias`,
                severity: 'medium'
            });
        }
        const proposalTasks = pendingTasks.filter(t => t.type === 'proposal');
        if (proposalTasks.length > 0) {
            const proposalDiffs = proposalTasks.map(t => ({
                diffDays: Math.ceil((new Date(t.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            }));
            const closest = proposalDiffs.sort((a, b) => a.diffDays - b.diffDays)[0];
            if (closest.diffDays < 0) {
                riskAlerts.push({
                    id: 'proposal-overdue',
                    label: 'Proposta vencida',
                    severity: 'high'
                });
            } else if (closest.diffDays <= 2) {
                riskAlerts.push({
                    id: 'proposal-due',
                    label: `Proposta vence em ${closest.diffDays} dias`,
                    severity: 'medium'
                });
            }
        }
    }

    let autoScore = 50;
    if (localLead.temperature === 'hot') autoScore += 15;
    if (localLead.temperature === 'warm') autoScore += 5;
    if (localLead.temperature === 'cold') autoScore -= 10;
    if (daysSinceInteraction !== null) {
        if (daysSinceInteraction <= 2) autoScore += 10;
        else if (daysSinceInteraction <= 7) autoScore += 0;
        else if (daysSinceInteraction <= 14) autoScore -= 10;
        else autoScore -= 20;
    }
    if (pendingTasks.length > 0) autoScore += Math.min(pendingTasks.length, 3) * 2;
    if (overdueTasks.length > 0) autoScore -= Math.min(overdueTasks.length, 3) * 5;
    if (localLead.value) {
        if (localLead.value >= 500000) autoScore += 10;
        else if (localLead.value >= 200000) autoScore += 5;
    }
    switch (localLead.status) {
        case LeadStatus.CLOSED:
            autoScore += 20;
            break;
        case LeadStatus.PROPOSAL:
            autoScore += 10;
            break;
        case LeadStatus.NEGOTIATION:
            autoScore += 5;
            break;
        case LeadStatus.QUALIFIED:
            autoScore += 5;
            break;
        case LeadStatus.LOST:
        case LeadStatus.DISQUALIFIED:
            autoScore -= 30;
            break;
        default:
            break;
    }
    autoScore = clampScore(autoScore);
    const hasHighRisk = riskAlerts.some(a => a.severity === 'high');
    const hasMediumRisk = riskAlerts.some(a => a.severity === 'medium');
    const riskLabel = hasHighRisk ? 'Alto' : hasMediumRisk ? 'Medio' : 'Baixo';

    return (
        <div
            className={`fixed inset-0 z-50 flex justify-center items-start animate-fade-in transition-all duration-300 ${isFullScreenLocal
                ? 'bg-slate-900/10 pt-0 px-0 pb-0'
                : 'bg-slate-900/10 pt-16 sm:pt-24 lg:pt-32 px-4 sm:px-6 pb-6'
                }`}
        >
            <div
                className={`w-full flex flex-col animate-slide-in-right overflow-hidden transition-all duration-300 ${isFullScreenLocal
                    ? 'h-full rounded-none bg-slate-50'
                    : 'max-w-6xl h-full rounded-3xl bg-slate-50 shadow-[0_24px_80px_rgba(15,23,42,0.32)] border border-white/40'
                    }`}
            >
                {/* Responsive Stage Bar with Navigation */}
                <div className="relative w-full flex items-center shadow-md z-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 z-20 p-2 h-full bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div
                        ref={scrollContainerRef}
                        className="flex-1 overflow-x-auto hide-scrollbar flex items-center px-10 py-4 gap-4 md:gap-6 whitespace-nowrap scroll-smooth"
                    >
                        {pipeline.stages.map((step, idx) => {
                            const isActive = currentStepIndex >= idx;
                            const isCompleted = currentStepIndex > idx;
                            const isCurrent = currentStepIndex === idx;

                            return (
                                <div
                                    key={step.id}
                                    onClick={() => handleStageClick(step.id)}
                                    className={`flex items-center gap-3 group cursor-pointer transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                                >
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 font-bold text-xs
                                        ${isCompleted ? 'bg-emerald-500/90 border-emerald-400 text-white' : ''}
                                        ${isCurrent ? 'bg-white/10 text-white border-white/40 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]' : ''}
                                        ${!isActive ? 'border-white/10 text-white/40 bg-transparent group-hover:border-white/30 group-hover:text-white/60' : ''}
                                    `}>
                                        {isCompleted ? <CheckCircle size={16} /> : idx + 1}
                                    </div>
                                    <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isCurrent ? 'bg-white/10 text-white rounded-full px-4 py-1' : 'text-white/50 group-hover:text-white/80'}`}>
                                        {step.title}
                                    </span>
                                    {idx < pipeline.stages.length - 1 && (
                                        <div className={`w-8 h-0.5 ml-2 transition-colors flex-shrink-0 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-white/10'}`}></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 z-20 p-2 h-full bg-gradient-to-l from-slate-900 via-slate-900/90 to-transparent text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className={`bg-slate-50 border-b border-white/60 ${isFullScreenLocal ? 'px-8 py-5' : 'px-6 py-4'}`}>
                    <div className={`bg-white shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between ${isFullScreenLocal ? 'rounded-xl px-5 py-4' : 'rounded-2xl px-4 py-3'}`}>
                        <div className="flex items-start sm:items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base bg-[#6D28D9]/10 text-[#6D28D9]`}>
                                {localLead.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 leading-tight">{localLead.name}</h2>
                                <p className="text-sm font-bold text-[#6D28D9]">
                                    {localLead.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <MapPin size={12} className="text-gray-400" />
                                    {localLead.interest}
                                </p>
                            </div>
                        </div>
                        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:w-auto">
                            <div className="flex w-full items-center rounded-full bg-white shadow-sm px-1 py-1 gap-1 overflow-x-auto max-w-full sm:w-auto">
                                <button onClick={() => setActiveMainTab('activity')} className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeMainTab === 'activity' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Atividades</button>
                                <button onClick={() => setActiveMainTab('notes')} className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeMainTab === 'notes' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Anotacoes</button>
                                <button onClick={() => setActiveMainTab('profile')} className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeMainTab === 'profile' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Dados do Cliente</button>
                                <button onClick={() => setActiveMainTab('files')} className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeMainTab === 'files' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Documentos</button>
                            </div>
                            <div className="inline-flex items-center gap-2 self-end sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setIsFullScreenLocal(!isFullScreenLocal)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:border-slate-300 transition"
                                    aria-label={isFullScreenLocal ? 'Restaurar janela' : 'Maximizar janela'}
                                >
                                    {isFullScreenLocal ? (
                                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="5" y="7" width="10" height="10" rx="1.5" />
                                            <rect x="9" y="3" width="10" height="10" rx="1.5" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="4" y="4" width="16" height="16" rx="2" />
                                        </svg>
                                    )}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm hover:bg-rose-50 hover:border-rose-200 transition"
                                >
                                    <X size={16} className="text-gray-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex overflow-hidden">
                    {/* ... (Existing Content for Detail Modal) ... */}
                    {activeMainTab === 'activity' && (
                        <>
                            <div className="flex-1 bg-gray-50 flex flex-col border-r border-gray-200">
                                <div className="bg-white border-b border-gray-200 shadow-sm">
                                    <div className="flex px-4 pt-2">
                                        <button onClick={() => { setActiveActionTab('schedule'); setActiveQuickAction(null); }} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeActionTab === 'schedule' ? 'border-brand-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Agendar / Nota</button>
                                        <button onClick={() => { setActiveActionTab('whatsapp'); setActiveQuickAction(null); }} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeActionTab === 'whatsapp' ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><MessageCircle size={16} className={activeActionTab === 'whatsapp' ? 'text-green-500' : ''} /> Enviar WhatsApp</button>
                                    </div>
                                    {activeActionTab === 'schedule' && (
                                        <div className="p-5 bg-white border-t border-gray-100">
                                            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 hide-scrollbar">
                                                <button
                                                    onClick={() => { setActionType('call'); setActiveQuickAction(null); }}
                                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${actionType === 'call'
                                                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <Phone size={14} /> Ligação
                                                </button>
                                                <button
                                                    onClick={() => { setActionType('meeting'); setActiveQuickAction(null); }}
                                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${actionType === 'meeting'
                                                        ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <User size={14} /> Reunião
                                                </button>
                                                <button
                                                    onClick={() => { setActionType('visit'); setActiveQuickAction(null); }}
                                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${actionType === 'visit'
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <MapPin size={14} /> Visita
                                                </button>
                                            </div>

                                            <form onSubmit={handleAddActivity} className="space-y-3">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder={`Assunto da ${actionType === 'call' ? 'Ligação' : actionType === 'meeting' ? 'Reunião' : 'Visita'}...`}
                                                        className="w-full pl-3 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                                                        value={taskTitle}
                                                        onChange={e => setTaskTitle(e.target.value)}
                                                    />
                                                </div>

                                                <div className="flex gap-3">
                                                    <input
                                                        type="date"
                                                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
                                                        value={taskDate}
                                                        onChange={e => setTaskDate(e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Adicionar nota rápida..."
                                                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
                                                        value={quickNote}
                                                        onChange={e => setQuickNote(e.target.value)}
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-black transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle size={16} /> Agendar Atividade
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                    {activeActionTab === 'whatsapp' && (
                                        <div className="p-4 bg-green-50/30">
                                            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
                                                {WHATSAPP_TEMPLATES.map(template => (
                                                    <button key={template.id} onClick={() => applyWhatsAppTemplate(template.text)} className="whitespace-nowrap px-3 py-1.5 bg-white border border-green-200 text-green-700 rounded-full text-xs font-bold hover:bg-green-50 transition-colors shadow-sm">{template.title}</button>
                                                ))}
                                            </div>
                                            <textarea value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-green-500 outline-none resize-none" placeholder="Digite sua mensagem..."></textarea>
                                            <button onClick={handleSendWhatsApp} disabled={!whatsappMessage} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 flex items-center gap-2 shadow-lg"><Send size={14} /> Abrir WhatsApp Web</button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleQuickAction('email')}
                                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-bold transition-colors ${activeQuickAction === 'email' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <Mail size={14} />
                                                E-mail
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleQuickShortcut('meeting')}
                                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-bold transition-colors ${activeQuickAction === 'meeting' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <Calendar size={14} />
                                                Reuniao
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleQuickShortcut('call')}
                                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-bold transition-colors ${activeQuickAction === 'call' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <Phone size={14} />
                                                Chamada
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleQuickShortcut('task')}
                                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-bold transition-colors ${activeQuickAction === 'task' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <CheckCircle size={14} />
                                                Tarefa
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleQuickShortcut('whatsapp')}
                                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-bold transition-colors ${activeQuickAction === 'whatsapp' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <MessageCircle size={14} />
                                                WhatsApp
                                            </button>
                                        </div>

                                        {activeQuickAction === 'email' && (
                                            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                <form onSubmit={handleQuickEmailSubmit} className="space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-500 mb-1">De</label>
                                                            <input
                                                                type="text"
                                                                value="contato@imobiliaria.com"
                                                                readOnly
                                                                className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-50 text-gray-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-500 mb-1">Para</label>
                                                            <input
                                                                type="text"
                                                                value={localLead.email || ''}
                                                                placeholder="Sem e-mail cadastrado"
                                                                readOnly
                                                                className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-50 text-gray-500"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 mb-1">Assunto</label>
                                                        <input
                                                            type="text"
                                                            value={emailSubject}
                                                            onChange={(e) => setEmailSubject(e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white"
                                                            placeholder="Assunto do e-mail"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 mb-1">Corpo</label>
                                                        <textarea
                                                            value={emailBody}
                                                            onChange={(e) => setEmailBody(e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white resize-none"
                                                            rows={4}
                                                            placeholder="Escreva sua mensagem..."
                                                        ></textarea>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded font-bold text-xs hover:bg-black">Enviar</button>
                                                        <button type="button" onClick={() => setActiveQuickAction(null)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded font-bold text-xs hover:bg-gray-50">Cancelar</button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                    {localLead.tasks?.some(t => !t.completed) && (
                                        <div className="mb-6">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Planejado</h4>
                                            <div className="space-y-2">
                                                {localLead.tasks.filter(t => !t.completed).map(task => (
                                                    <div key={task.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-start gap-3 hover:border-brand-300 transition-colors group">
                                                        <button onClick={() => markTaskDone(task.id)} className="mt-0.5 w-5 h-5 rounded border border-gray-300 hover:bg-green-50 hover:border-green-500 transition-colors flex items-center justify-center text-white hover:text-green-600">
                                                            <CheckCircle size={14} className="opacity-0 group-hover:opacity-100" />
                                                        </button>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between">
                                                                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">{getActivityIcon(task.type)} {task.title}</span>
                                                                <span className={`text-xs font-medium ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>{new Date(task.dueDate).toLocaleDateString()}</span>
                                                            </div>
                                                            {task.notes && <p className="text-xs text-gray-500 mt-1">{task.notes}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Histórico</h4>
                                        <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pl-6 pb-4">
                                            {timelineItems.map((item: any) => (
                                                <div key={item.id} className="relative">
                                                    <div className={`absolute -left-[1.9375rem] top-0 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${item.type === 'note' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-500'}`}>
                                                        {item.type === 'note' ? <FileText size={12} /> : getActivityIcon(item.content.type)}
                                                    </div>
                                                    {item.type === 'note' ? (
                                                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-gray-700"><p>{item.content}</p><span className="text-xs text-yellow-600/60 mt-2 block">{new Date(item.date).toLocaleString()}</span></div>
                                                    ) : (
                                                        <div className={`text-sm ${item.content.completed ? 'opacity-75' : ''}`}>
                                                            <p className="font-bold text-gray-800 flex items-center gap-2"><span className={item.content.completed ? 'line-through text-gray-500' : ''}>{item.content.title}</span></p>
                                                            <p className="text-xs text-gray-400">{new Date(item.date).toLocaleString()}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-96 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="mb-8 bg-brand-50 rounded-xl p-4 border border-brand-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-bold text-brand-900 flex items-center gap-2"><ScrollText size={16} /> Roteiro: {currentFunnelPhase.title.split(') ')[1]}</h3>
                                        </div>
                                        <div className="space-y-2">
                                            {currentFunnelPhase.questions.map((q, idx) => (
                                                <label key={idx} className="flex items-start gap-2 cursor-pointer hover:bg-white/50 p-1.5 rounded transition-colors select-none">
                                                    <input type="checkbox" checked={localLead.scriptData?.[q] || false} onChange={(e) => handleScriptCheck(q, e.target.checked)} className="mt-1 rounded text-brand-600" />
                                                    <span className={`text-xs leading-tight ${localLead.scriptData?.[q] ? 'text-brand-900 font-medium line-through opacity-70' : 'text-brand-800'}`}>{q}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-6 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Resumo rapido</h3>
                                        <div className="space-y-2 text-xs text-gray-600">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-gray-500">Proxima acao</span>
                                                <span className="font-bold text-gray-900 text-right">{suggestedAction}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-gray-500">Ultimo contato</span>
                                                <span className="font-medium text-gray-700">{lastInteractionLabel}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-gray-500">Score automatico</span>
                                                <span className="font-bold text-gray-900">{autoScore}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`text-[0.6875rem] font-bold px-2 py-0.5 rounded-full ${hasHighRisk ? 'bg-red-50 text-red-600' : hasMediumRisk ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {riskLabel}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mb-6 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Alertas de risco</h3>
                                        {riskAlerts.length > 0 ? (
                                            <div className="space-y-2">
                                                {riskAlerts.map(alert => (
                                                    <div
                                                        key={alert.id}
                                                        className={`text-xs font-semibold px-2.5 py-1.5 rounded border ${alert.severity === 'high'
                                                            ? 'bg-red-50 border-red-100 text-red-600'
                                                            : alert.severity === 'medium'
                                                                ? 'bg-amber-50 border-amber-100 text-amber-600'
                                                                : 'bg-sky-50 border-sky-100 text-sky-600'
                                                            }`}
                                                    >
                                                        {alert.label}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-500">Nenhum alerta ativo.</div>
                                        )}
                                    </div>
                                    <div className="mb-6 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <Home size={14} className="text-gray-400" />
                                                Imoveis vinculados
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (showPropertyPicker) {
                                                        setSelectedPropertyId('');
                                                        setPropertySearch('');
                                                    }
                                                    setShowPropertyPicker(prev => !prev);
                                                }}
                                                className="text-[0.6875rem] font-bold text-gray-600 hover:text-gray-900"
                                            >
                                                {showPropertyPicker ? 'Fechar' : 'Adicionar'}
                                            </button>
                                        </div>

                                        {showPropertyPicker && (
                                            <div className="mb-3 space-y-2">
                                                <input
                                                    type="text"
                                                    value={propertySearch}
                                                    onChange={(e) => setPropertySearch(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white"
                                                    placeholder="Buscar imovel por nome ou endereco"
                                                />
                                                <select
                                                    value={selectedPropertyId}
                                                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white"
                                                >
                                                    <option value="">Selecione um imovel</option>
                                                    {filteredPropertyOptions.map(property => (
                                                        <option key={property.id} value={property.id}>
                                                            {property.title} - {property.city}/{property.state}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={handleAddLinkedProperty}
                                                    disabled={!selectedPropertyId}
                                                    className={`w-full px-3 py-2 rounded text-xs font-bold ${selectedPropertyId ? 'bg-gray-900 text-white hover:bg-black' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    Vincular imovel
                                                </button>
                                            </div>
                                        )}

                                        {linkedProperties.length > 0 ? (
                                            <div className="space-y-3">
                                                {linkedProperties.map(property => {
                                                    const realEstateInfo = realEstatePropertyBySiteId.get(property.id) as any;
                                                    const mainValue = getPropertyMainValue(property);
                                                    const commission = getCommissionEstimate(property);
                                                    const floor = getFloorFromUnit(realEstateInfo?.unidade);
                                                    const isManual = manualLinkedPropertyIds.includes(property.id);
                                                    const linkLabel = isManual ? 'Manual' : 'Auto';
                                                    const linkBadgeClass = isManual
                                                        ? 'border-slate-200 bg-slate-50 text-slate-600'
                                                        : 'border-emerald-200 bg-emerald-50 text-emerald-600';
                                                    const formattedMainValue = mainValue.value
                                                        ? mainValue.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                        : '-';
                                                    const formattedCommission = commission
                                                        ? `${commission.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${Math.round(commission.rate * 100)}%)`
                                                        : '-';

                                                    return (
                                                        <div key={property.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                                            <div className="flex gap-3">
                                                                <div className="h-16 w-16 rounded-md overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                                                                    {property.images?.[0] ? (
                                                                        <img src={property.images[0]} alt={property.title} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <Home size={18} className="text-gray-400" />
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="min-w-0">
                                                                            <p className="text-sm font-bold text-gray-900 truncate">{property.title}</p>
                                                                            <p className="text-[0.6875rem] text-gray-500 truncate">
                                                                                {property.address} - {property.city}/{property.state}
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-1">
                                                                            <span className="text-[0.625rem] px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-600">
                                                                                {getPropertyStatusLabel(property.status)}
                                                                            </span>
                                                                            <span className="text-[0.625rem] px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-600">
                                                                                {localLead.status}
                                                                            </span>
                                                                            <span className={`text-[0.625rem] px-2 py-0.5 rounded-full border ${linkBadgeClass}`}>
                                                                                {linkLabel}
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleUnlinkProperty(property.id)}
                                                                                className="text-[0.625rem] font-semibold text-rose-500 hover:text-rose-600"
                                                                            >
                                                                                Desvincular
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[0.6875rem] text-gray-600">
                                                                        <div>
                                                                            <span className="text-gray-400">{mainValue.label}</span> {formattedMainValue}
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-400">Comissao</span> {formattedCommission}
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-400">Torre/Bloco</span>{' '}
                                                                            {realEstateInfo?.torre || realEstateInfo?.bloco || '-'}
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-400">Unidade</span> {realEstateInfo?.unidade || '-'}
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-400">Andar</span> {floor || '-'}
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-400">Codigo</span> {realEstateInfo?.codigo || '-'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-500">Nenhum imovel vinculado.</div>
                                        )}
                                    </div>
                                    {/* ... Other Sidebar widgets ... */}
                                    <div className="mb-6">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Negócio</h3>
                                        <div className="font-bold text-gray-900 border-b border-gray-100 pb-1 flex items-center gap-2 mb-2">
                                            <DollarSign size={14} className="text-gray-400" />
                                            {localLead.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    {activeMainTab === 'notes' && (
                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                            <div className="max-w-3xl mx-auto space-y-6">
                                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">Anotacoes internas</h3>
                                    <form onSubmit={handleAddNote} className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Titulo</label>
                                            <input
                                                type="text"
                                                value={noteTitle}
                                                onChange={(e) => setNoteTitle(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white"
                                                placeholder="Ex: Preferencia de contato"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Nota</label>
                                            <textarea
                                                value={noteBody}
                                                onChange={(e) => setNoteBody(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white resize-none"
                                                rows={4}
                                                placeholder="Escreva uma anotacao interna..."
                                            ></textarea>
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded font-bold text-xs hover:bg-black">Salvar anotacao</button>
                                            <button type="button" onClick={() => { setNoteTitle(''); setNoteBody(''); }} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded font-bold text-xs hover:bg-gray-50">Limpar</button>
                                        </div>
                                    </form>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Historico de anotacoes</h4>
                                    {localLead.notes && localLead.notes.length > 0 ? (
                                        <div className="space-y-2">
                                            {localLead.notes.map((note, index) => (
                                                <div key={`${localLead.id}-note-${index}`} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                                    <p className="text-sm text-gray-700">{note}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-dashed border-gray-200 rounded-lg p-4 text-sm text-gray-500">
                                            Nenhuma anotacao registrada.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeMainTab === 'profile' && (
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
                            <div className="max-w-3xl mx-auto">
                                {/* PROFILE SELECTOR */}
                                <div className="flex items-center gap-3 mb-6 bg-white p-2 rounded-lg border border-gray-100 shadow-sm w-full sm:w-fit overflow-x-auto max-w-full">
                                    {crmSettings.enableProfileWA && (
                                        <button
                                            onClick={() => setActiveProfile('WA')}
                                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeProfile === 'WA' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            WA (WA-Seller)
                                        </button>
                                    )}
                                    {crmSettings.enableProfileSF && (
                                        <button
                                            onClick={() => setActiveProfile('SF')}
                                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeProfile === 'SF' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            SF (Salesforce)
                                        </button>
                                    )}
                                    {crmSettings.enableProfilePD && (
                                        <button
                                            onClick={() => setActiveProfile('PD')}
                                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeProfile === 'PD' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            PD (Pipedrive)
                                        </button>
                                    )}
                                    {crmSettings.enableProfileRD && (
                                        <button
                                            onClick={() => setActiveProfile('RD')}
                                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeProfile === 'RD' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            RD/TOTVS
                                        </button>
                                    )}
                                    {crmSettings.enableProfileMaster && (
                                        <button
                                            onClick={() => setActiveProfile('MASTER')}
                                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeProfile === 'MASTER' ? 'bg-brand-900 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            MASTER
                                        </button>
                                    )}
                                </div>

                                {activeProfile === 'MASTER' ? (
                                    // --- MASTER PREMIUM PROFILE LAYOUT (15 Cards) ---
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

                                        {/* Card 1: Dados Gerais do Cliente */}
                                        <ProfileSection title="Dados Gerais do Cliente" icon={User} isOpen={profileSections.master_general} toggle={() => setProfileSections(prev => ({ ...prev, master_general: !prev.master_general }))}>
                                            <div className="grid grid-cols-1 gap-3">
                                                <FormInput label="Nome completo" value={localLead.name} onChange={(v) => setLocalLead({ ...localLead, name: v })} />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <FormInput label="Telefone" value={localLead.phone} onChange={(v) => setLocalLead({ ...localLead, phone: v })} />
                                                    <FormInput label="WhatsApp" value={localLead.phone} readOnly />
                                                </div>
                                                <FormInput label="Email" value={localLead.email} onChange={(v) => setLocalLead({ ...localLead, email: v })} />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <FormInput label="CPF / CNPJ" value={localLead.profile?.cpf} onChange={(v) => updateProfile('profile', 'cpf', v)} />
                                                    <FormInput label="Data de nascimento" type="date" value={localLead.profile?.birthDate} onChange={(v) => updateProfile('profile', 'birthDate', v)} />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <FormSelect label="Sexo" value={(localLead.profile as any)?.gender} options={[{ label: 'Masculino', value: 'M' }, { label: 'Feminino', value: 'F' }]} onChange={(v) => updateProfile('profile', 'gender', v)} />
                                                    <FormSelect label="Estado civil" value={localLead.profile?.maritalStatus} options={[{ label: 'Solteiro', value: 'single' }, { label: 'Casado', value: 'married' }, { label: 'Divorciado', value: 'divorced' }]} onChange={(v) => updateProfile('profile', 'maritalStatus', v)} />
                                                </div>
                                                <FormInput label="Profissão" value={localLead.profile?.occupation} onChange={(v) => updateProfile('profile', 'occupation', v)} />
                                                <FormInput label="Renda mensal" value={localLead.profile?.income} type="number" onChange={(v) => updateProfile('profile', 'income', v)} />
                                                <FormInput label="Nacionalidade" value={localLead.profile?.nationality} onChange={(v) => updateProfile('profile', 'nationality', v)} />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <FormInput label="RG" value={localLead.profile?.rg} onChange={(v) => updateProfile('profile', 'rg', v)} />
                                                    <FormInput label="Inscrição estadual" value={(localLead.enrichedData as any)?.inscription} placeholder="ISENTO" />
                                                </div>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 2: Endereço Completo */}
                                        <ProfileSection title="Endereço Completo" icon={MapPin} isOpen={profileSections.master_address} toggle={() => setProfileSections(prev => ({ ...prev, master_address: !prev.master_address }))}>
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div className="sm:col-span-2"><FormInput label="Rua" value={localLead.address?.street} onChange={(v) => updateProfile('address', 'street', v)} /></div>
                                                    <div className="sm:col-span-1"><FormInput label="Número" value={localLead.address?.number} onChange={(v) => updateProfile('address', 'number', v)} /></div>
                                                </div>
                                                <FormInput label="Complemento" value={localLead.address?.complement} onChange={(v) => updateProfile('address', 'complement', v)} />
                                                <FormInput label="Bairro" value={localLead.address?.neighborhood} onChange={(v) => updateProfile('address', 'neighborhood', v)} />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <FormInput label="Cidade" value={localLead.address?.city} onChange={(v) => updateProfile('address', 'city', v)} />
                                                    <FormInput label="Estado" value={localLead.address?.state} onChange={(v) => updateProfile('address', 'state', v)} />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <FormInput label="CEP" value={localLead.address?.zipCode} onChange={(v) => updateProfile('address', 'zipCode', v)} />
                                                    <FormInput label="País" value="Brasil" readOnly />
                                                </div>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 3: Perfil Comercial */}
                                        <ProfileSection title="Perfil Comercial" icon={Briefcase} isOpen={profileSections.master_commercial} toggle={() => setProfileSections(prev => ({ ...prev, master_commercial: !prev.master_commercial }))}>
                                            <FormSelect label="Tipo de cliente" value={(localLead.enrichedData as any)?.clientType} options={[{ label: 'Comprador', value: 'buyer' }, { label: 'Vendedor', value: 'seller' }, { label: 'Investidor', value: 'investor' }]} onChange={(v) => updateSFData('clientType', v)} />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <FormInput label="Score do lead" value={localLead.score} type="number" readOnly />
                                                <FormSelect label="Perfil do lead" value={(localLead.enrichedData as any)?.leadProfile} options={['A', 'B', 'C', 'D'].map(o => ({ label: o, value: o }))} onChange={(v) => updateSFData('leadProfile', v)} />
                                            </div>
                                            <FormSelect label="Urgência" value={localLead.temperature} options={[{ label: 'Alta (Quente)', value: 'hot' }, { label: 'Média (Morno)', value: 'warm' }, { label: 'Baixa (Frio)', value: 'cold' }]} onChange={() => { }} />
                                            <FormSelect label="Tipo de pagamento" value={(localLead.enrichedData as any)?.paymentType} options={[{ label: 'À Vista', value: 'cash' }, { label: 'Financiamento', value: 'financing' }, { label: 'Permuta', value: 'exchange' }]} onChange={(v) => updateSFData('paymentType', v)} />
                                            <FormInput label="Captação" value={localLead.source} readOnly />
                                            <FormInput label="Canal de origem" placeholder="Ex: Instagram Ads" />
                                            <FormInput label="Campanha (UTM)" placeholder="utm_source=google&utm_medium=cpc" />
                                        </ProfileSection>

                                        {/* Card 4: Empresa / Organização */}
                                        <ProfileSection title="Empresa / Organização" icon={Building} isOpen={profileSections.master_company} toggle={() => setProfileSections(prev => ({ ...prev, master_company: !prev.master_company }))}>
                                            <FormInput label="Nome da empresa" value={localLead.enrichedData?.company} onChange={(v) => updateSFData('company', v)} />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <FormInput label="CNPJ" placeholder="00.000.000/0000-00" />
                                                <FormSelect label="Porte" value="" options={[{ label: 'Pequena', value: 'small' }, { label: 'Média', value: 'medium' }, { label: 'Grande', value: 'large' }]} onChange={() => { }} />
                                            </div>
                                            <FormInput label="Setor" value={(localLead.enrichedData as any)?.industry} onChange={(v) => updateSFData('industry', v)} />
                                            <FormInput label="Site" value={(localLead.enrichedData as any)?.website} onChange={(v) => updateSFData('website', v)} />
                                            <FormInput label="LinkedIn" value={localLead.enrichedData?.linkedin} onChange={(v) => updateSFData('linkedin', v)} />
                                            <FormInput label="Endereço da empresa" placeholder="Endereço comercial completo" />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <FormInput label="Funcionários" value={(localLead.enrichedData as any)?.employees} onChange={(v) => updateSFData('employees', v)} />
                                                <FormInput label="Receita anual" value={(localLead.enrichedData as any)?.revenue} onChange={(v) => updateSFData('revenue', v)} />
                                            </div>
                                            <FormInput label="Responsável principal" value={localLead.name} readOnly />
                                        </ProfileSection>

                                        {/* Card 5: Interesse Imobiliário Completo */}
                                        <ProfileSection title="Interesse Imobiliário Completo" icon={Home} isOpen={profileSections.master_interest} toggle={() => setProfileSections(prev => ({ ...prev, master_interest: !prev.master_interest }))}>
                                            <FormSelect label="Finalidade" value={localLead.preferences?.purpose} options={[{ label: 'Morar', value: 'live' }, { label: 'Investir', value: 'invest' }]} onChange={(v) => updateProfile('preferences', 'purpose', v)} />
                                            <FormSelect label="Tipo de imóvel" value={localLead.preferences?.propertyType?.[0]} options={['Apartamento', 'Casa', 'Comercial', 'Terreno'].map(o => ({ label: o, value: o }))} onChange={() => { }} />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <FormInput label="Metragem Mín" value={localLead.preferences?.minArea} type="number" onChange={(v) => updateProfile('preferences', 'minArea', v)} />
                                                <FormInput label="Dormitórios" value={localLead.preferences?.minBedrooms} type="number" onChange={(v) => updateProfile('preferences', 'minBedrooms', v)} />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <FormInput label="Vagas" value={localLead.preferences?.parkingSpots} type="number" onChange={(v) => updateProfile('preferences', 'parkingSpots', v)} />
                                                <FormInput label="Valor Máximo" value={localLead.preferences?.maxBudget} type="number" onChange={(v) => updateProfile('preferences', 'maxBudget', v)} />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <FormSelect label="Pet Friendly" value={localLead.preferences?.pets ? 'sim' : 'nao'} options={[{ label: 'Sim', value: 'sim' }, { label: 'Não', value: 'nao' }]} onChange={() => { }} />
                                                <FormInput label="Condomínio Max" placeholder="R$ 0,00" />
                                            </div>
                                            <div className="mt-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Localização</label>
                                                <textarea rows={2} className="w-full px-3 py-2 border rounded text-sm bg-white resize-none" placeholder="Bairros, cidades ou regiões de interesse..." defaultValue={localLead.address?.neighborhood}></textarea>
                                            </div>
                                            <div className="mt-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Preferências</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['Próximo metrô', 'Academia', 'Varanda Gourmet', 'Sol da manhã'].map(tag => (
                                                        <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded border cursor-pointer hover:bg-gray-200">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 6: Imóvel Vinculado */}
                                        <ProfileSection title="Imóvel Vinculado" icon={Key} isOpen={profileSections.master_property} toggle={() => setProfileSections(prev => ({ ...prev, master_property: !prev.master_property }))}>
                                            <FormInput label="Nome do imóvel" value={localLead.interest} onChange={(v) => setLocalLead({ ...localLead, interest: v })} />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <FormInput label="Código interno" placeholder="COD-123" />
                                                <FormInput label="Torre" placeholder="Bloco A" />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <FormInput label="Andar" placeholder="5º" />
                                                <FormInput label="Unidade" placeholder="52" />
                                            </div>
                                            <FormInput label="Valor atual" value={localLead.value} type="number" readOnly />
                                            <FormInput label="Link do anúncio" placeholder="https://ivillar.com/..." />
                                            <button className="w-full py-2 bg-brand-600 text-white font-bold text-xs rounded shadow-sm hover:bg-brand-700 mt-2">Ver Imóvel</button>
                                        </ProfileSection>

                                        {/* Card 7: Negócio / Oportunidade */}
                                        <ProfileSection title="Negócio / Oportunidade" icon={TrendingUp} isOpen={profileSections.master_deal} toggle={() => setProfileSections(prev => ({ ...prev, master_deal: !prev.master_deal }))}>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <FormInput label="Valor do negócio" value={localLead.value} type="number" onChange={(v) => setLocalLead({ ...localLead, value: Number(v) })} />
                                                <FormInput label="Probabilidade (%)" value={localLead.probability} type="number" onChange={(v) => setLocalLead({ ...localLead, probability: Number(v) })} />
                                            </div>
                                            <FormInput label="Etapa atual" value={localLead.status} readOnly />
                                            <FormInput label="Data prevista fechamento" type="date" />
                                            <FormInput label="Origem" value={localLead.source} readOnly />
                                            <FormSelect label="Situação" value="active" options={[{ label: 'Em andamento', value: 'active' }, { label: 'Ganho', value: 'won' }, { label: 'Perdido', value: 'lost' }]} onChange={() => { }} />
                                            {localLead.status === LeadStatus.LOST && <FormInput label="Motivo da perda" value={localLead.lostReason} readOnly />}
                                        </ProfileSection>

                                        {/* Card 8: Proposta e Simulação */}
                                        <ProfileSection title="Proposta e Simulação" icon={FileText} isOpen={profileSections.master_proposal} toggle={() => setProfileSections(prev => ({ ...prev, master_proposal: !prev.master_proposal }))}>
                                            <FormInput label="Valor ofertado" placeholder="R$ 0,00" />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <FormInput label="Entrada" placeholder="R$ 0,00" />
                                                <FormInput label="Parcelas" placeholder="Ex: 360x" />
                                            </div>
                                            <FormSelect label="Banco preferido" value="" options={[{ label: 'Caixa', value: 'cef' }, { label: 'Itaú', value: 'itau' }, { label: 'Bradesco', value: 'bradesco' }, { label: 'Santander', value: 'santander' }]} onChange={() => { }} />
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200 mt-2">
                                                <span className="text-xs font-bold text-gray-500 block mb-2">Simulação Automática</span>
                                                <div className="text-center text-xs text-gray-400 italic">Integração bancária não configurada.</div>
                                            </div>
                                            <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                                <button className="flex-1 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded border hover:bg-gray-200">Anexar Proposta</button>
                                                <button className="flex-1 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded border hover:bg-gray-200">Histórico</button>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 9: Documentos e Arquivos */}
                                        <ProfileSection title="Documentos e Arquivos" icon={Folder} isOpen={profileSections.master_docs} toggle={() => setProfileSections(prev => ({ ...prev, master_docs: !prev.master_docs }))}>
                                            <div className="space-y-2">
                                                {['RG', 'CPF', 'Comprovante de Renda', 'Comprovante de Endereço'].map((doc, i) => (
                                                    <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100">
                                                        <span className="text-xs font-medium text-gray-700">{doc}</span>
                                                        <span className="text-[0.625rem] text-gray-400 italic">Pendente</span>
                                                    </div>
                                                ))}
                                                <button className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded font-bold text-xs hover:bg-gray-50 flex items-center justify-center gap-2">
                                                    <Upload size={14} /> Upload Geral
                                                </button>
                                                <button className="w-full py-2 bg-brand-50 text-brand-700 font-bold text-xs rounded hover:bg-brand-100 flex items-center justify-center gap-2">
                                                    <FileCheck size={14} /> Gerar Contrato PDF
                                                </button>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 10: WA CRM / Comunicação */}
                                        <ProfileSection title="WA CRM / Comunicação" icon={MessageCircle} isOpen={profileSections.master_communication} toggle={() => setProfileSections(prev => ({ ...prev, master_communication: !prev.master_communication }))}>
                                            <div className="bg-green-50 p-3 rounded border border-green-100 mb-3">
                                                <div className="flex justify-between text-xs text-green-800 mb-1">
                                                    <span className="font-bold">Última mensagem</span>
                                                    <span>Hoje, 10:45</span>
                                                </div>
                                                <p className="text-xs text-green-700 italic">"Gostaria de agendar para sábado..."</p>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                                <div className="text-center p-2 bg-gray-50 rounded border">
                                                    <span className="block text-[0.625rem] text-gray-500 uppercase">Status</span>
                                                    <span className="text-xs font-bold text-blue-500 flex items-center justify-center gap-1"><Check size={12} /> Lido</span>
                                                </div>
                                                <div className="text-center p-2 bg-gray-50 rounded border">
                                                    <span className="block text-[0.625rem] text-gray-500 uppercase">Resposta</span>
                                                    <span className="text-xs font-bold text-gray-700">Pendente</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                                <button className="py-2 bg-green-600 text-white font-bold text-xs rounded shadow-sm hover:bg-green-700 flex items-center justify-center gap-2">
                                                    <MessageSquare size={14} /> Mensagem Rápida
                                                </button>
                                                {crmSettings.enableAutomations && (
                                                    <button
                                                        onClick={() => setAutomationModalOpen(true)}
                                                        className="py-2 bg-indigo-600 text-white font-bold text-xs rounded shadow-sm hover:bg-indigo-700 flex items-center justify-center gap-2 animate-pulse"
                                                    >
                                                        <Bot size={14} /> Automações
                                                    </button>
                                                )}
                                            </div>
                                        </ProfileSection>

                                        {/* Card 11: Atividades / Timeline */}
                                        <ProfileSection title="Atividades / Timeline" icon={Clock} isOpen={profileSections.master_timeline} toggle={() => setProfileSections(prev => ({ ...prev, master_timeline: !prev.master_timeline }))}>
                                            <div className="relative border-l-2 border-gray-200 ml-2 space-y-4 pl-4 py-1">
                                                <div className="relative">
                                                    <div className="absolute -left-[1.3125rem] top-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                                                    <p className="text-xs font-bold text-gray-800">Reunião Agendada</p>
                                                    <p className="text-[0.625rem] text-gray-500">Amanhã às 14:00</p>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute -left-[1.3125rem] top-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                                    <p className="text-xs font-bold text-gray-800">WhatsApp Enviado</p>
                                                    <p className="text-[0.625rem] text-gray-500">Hoje às 09:30</p>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute -left-[1.3125rem] top-0 w-4 h-4 bg-gray-300 rounded-full border-2 border-white"></div>
                                                    <p className="text-xs font-bold text-gray-800">Lead Criado</p>
                                                    <p className="text-[0.625rem] text-gray-500">Há 3 dias</p>
                                                </div>
                                            </div>
                                            <button className="w-full mt-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded hover:bg-gray-200">+ Nova Atividade</button>
                                        </ProfileSection>

                                        {/* Card 12: Produtos / Serviços */}
                                        <ProfileSection title="Produtos / Serviços" icon={ShoppingBag} isOpen={profileSections.master_products} toggle={() => setProfileSections(prev => ({ ...prev, master_products: !prev.master_products }))}>
                                            <div className="text-center py-4 text-gray-400 text-xs border border-dashed rounded bg-gray-50">
                                                Nenhum produto adicionado.
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2 mt-2">
                                                <button className="flex-1 py-1.5 bg-white border border-gray-300 rounded text-xs font-bold text-gray-600 hover:bg-gray-50">Add Produto</button>
                                                <button className="flex-1 py-1.5 bg-white border border-gray-300 rounded text-xs font-bold text-gray-600 hover:bg-gray-50">Add Serviço</button>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 13: Financeiro */}
                                        <ProfileSection title="Financeiro" icon={CreditCard} isOpen={profileSections.master_financial} toggle={() => setProfileSections(prev => ({ ...prev, master_financial: !prev.master_financial }))}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-gray-500">Valor Total</span>
                                                <span className="text-sm font-bold text-gray-900">R$ 0,00</span>
                                            </div>
                                            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mb-3">
                                                <div className="h-full bg-green-500 w-0"></div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <button className="py-2 bg-gray-50 border rounded text-xs font-medium text-gray-600 hover:bg-gray-100">Parcelas</button>
                                                <button className="py-2 bg-gray-50 border rounded text-xs font-medium text-gray-600 hover:bg-gray-100">Comprovantes</button>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 14: Projetos */}
                                        <ProfileSection title="Projetos" icon={Box} isOpen={profileSections.master_projects} toggle={() => setProfileSections(prev => ({ ...prev, master_projects: !prev.master_projects }))}>
                                            <div className="space-y-3">
                                                <FormInput label="Nome do projeto" placeholder="Ex: Reforma Apto 52" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-gray-500">Situação</span>
                                                    <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded">Planejamento</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="w-6 h-6 bg-gray-200 rounded-full text-[0.625rem] flex items-center justify-center font-bold text-gray-500">ES</div>
                                                    <span className="text-xs text-gray-600">Eduardo Santos (Resp.)</span>
                                                </div>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 15: Campos Personalizados */}
                                        <ProfileSection title="Campos Personalizados" icon={Database} isOpen={profileSections.master_custom} toggle={() => setProfileSections(prev => ({ ...prev, master_custom: !prev.master_custom }))}>
                                            <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                                                <Plus size={24} className="text-gray-300 mb-2" />
                                                <p className="text-xs font-bold text-gray-500">Criar novo campo</p>
                                                <p className="text-[0.625rem] text-gray-400">Arraste e solte para organizar</p>
                                            </div>
                                            <button className="w-full mt-2 py-1.5 text-xs text-brand-600 font-bold hover:underline">Gerenciar Grupos</button>
                                        </ProfileSection>

                                    </div>
                                ) : activeProfile === 'RD' ? (
                                    // --- RD/TOTVS PROFILE LAYOUT ---
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                        {/* Card 1: Informações Principais */}
                                        <ProfileSection title="Informações Principais" icon={Info} isOpen={profileSections.rd_main} toggle={() => setProfileSections(prev => ({ ...prev, rd_main: !prev.rd_main }))}>
                                            <div className="grid grid-cols-1 gap-3">
                                                <FormInput label="Nome" value={localLead.name} onChange={(v) => setLocalLead({ ...localLead, name: v })} />
                                                <FormInput label="Email" value={localLead.email} onChange={(v) => setLocalLead({ ...localLead, email: v })} />
                                                <FormInput label="Telefone" value={localLead.phone} onChange={(v) => setLocalLead({ ...localLead, phone: v })} />
                                                <FormInput label="WhatsApp" value={localLead.phone} readOnly />

                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Tags</label>
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {localLead.tags?.map((tag, i) => (
                                                            <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded border">{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <FormInput label="Score do lead" value={localLead.score} readOnly />
                                                    <FormSelect label="Perfil do lead" value="A" options={[{ label: 'A', value: 'A' }, { label: 'B', value: 'B' }, { label: 'C', value: 'C' }]} onChange={() => { }} />
                                                </div>

                                                <FormSelect label="Status atual" value={localLead.status} options={Object.values(LeadStatus).map(s => ({ label: s, value: s }))} onChange={(v) => setLocalLead({ ...localLead, status: v as any })} />
                                                <FormInput label="Produto/Serviço de interesse" value={localLead.interest} onChange={(v) => setLocalLead({ ...localLead, interest: v })} />
                                                <FormInput label="Responsável pelo lead" value={assignedAgent?.name} readOnly />
                                            </div>
                                        </ProfileSection>

                                        {/* Card 2: Qualificação */}
                                        <ProfileSection title="Qualificação" icon={CheckCircle} isOpen={profileSections.rd_qual} toggle={() => setProfileSections(prev => ({ ...prev, rd_qual: !prev.rd_qual }))}>
                                            <FormSelect label="Lead qualificado?" value={localLead.status === LeadStatus.QUALIFIED ? 'sim' : 'nao'} options={[{ label: 'Sim', value: 'sim' }, { label: 'Não', value: 'nao' }]} onChange={() => { }} />
                                            <FormInput label="Motivo da qualificação" placeholder="Ex: Possui orçamento" />
                                            <FormInput label="Nível de interesse" value={localLead.temperature} readOnly />
                                            <FormInput label="Canal de origem" value={localLead.source} readOnly />
                                            <FormInput label="Origem da conversão" placeholder="Ex: Landing Page X" />
                                            <FormInput label="Campanha (utm_campaign)" placeholder="Ex: black_friday" />
                                            <FormSelect label="Tipo de lead" value="cliente" options={[{ label: 'Cliente', value: 'cliente' }, { label: 'Parceiro', value: 'parceiro' }, { label: 'Concorrente', value: 'concorrente' }]} onChange={() => { }} />
                                        </ProfileSection>

                                        {/* Card 3: Dados Pessoais */}
                                        <ProfileSection title="Dados Pessoais" icon={User} isOpen={profileSections.rd_personal} toggle={() => setProfileSections(prev => ({ ...prev, rd_personal: !prev.rd_personal }))}>
                                            <FormInput label="CPF ou CNPJ" value={localLead.profile?.cpf} onChange={(v) => updateProfile('profile', 'cpf', v)} />
                                            <FormInput label="Data de nascimento" value={localLead.profile?.birthDate} type="date" onChange={(v) => updateProfile('profile', 'birthDate', v)} />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <FormSelect label="Sexo" value={localLead.profile?.gender || ''} options={[{ label: 'Masculino', value: 'M' }, { label: 'Feminino', value: 'F' }]} onChange={(v) => updateProfile('profile', 'gender', v)} />
                                                <FormSelect label="Estado civil" value={localLead.profile?.maritalStatus} options={[{ label: 'Solteiro', value: 'single' }, { label: 'Casado', value: 'married' }]} onChange={(v) => updateProfile('profile', 'maritalStatus', v)} />
                                            </div>
                                            <FormInput label="Nacionalidade" value={localLead.profile?.nationality} onChange={(v) => updateProfile('profile', 'nationality', v)} />
                                            <div className="mt-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Endereço completo</label>
                                                <div className="space-y-2">
                                                    <input placeholder="Rua" className="w-full px-3 py-2 border rounded text-sm outline-none" value={localLead.address?.street} onChange={(e) => updateProfile('address', 'street', e.target.value)} />
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <input placeholder="Número" className="w-full sm:w-1/3 px-3 py-2 border rounded text-sm outline-none" value={localLead.address?.number} onChange={(e) => updateProfile('address', 'number', e.target.value)} />
                                                        <input placeholder="Bairro" className="w-full sm:w-2/3 px-3 py-2 border rounded text-sm outline-none" value={localLead.address?.neighborhood} onChange={(e) => updateProfile('address', 'neighborhood', e.target.value)} />
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <input placeholder="Cidade" className="w-full sm:w-2/3 px-3 py-2 border rounded text-sm outline-none" value={localLead.address?.city} onChange={(e) => updateProfile('address', 'city', e.target.value)} />
                                                        <input placeholder="UF" className="w-full sm:w-1/3 px-3 py-2 border rounded text-sm outline-none" value={localLead.address?.state} onChange={(e) => updateProfile('address', 'state', e.target.value)} />
                                                    </div>
                                                    <input placeholder="CEP" className="w-full px-3 py-2 border rounded text-sm outline-none" value={localLead.address?.zipCode} onChange={(e) => updateProfile('address', 'zipCode', e.target.value)} />
                                                </div>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 4: Dados da Empresa */}
                                        <ProfileSection title="Dados da Empresa" icon={Building} isOpen={profileSections.rd_company} toggle={() => setProfileSections(prev => ({ ...prev, rd_company: !prev.rd_company }))}>
                                            <FormInput label="Nome da empresa" value={localLead.enrichedData?.company} onChange={(v) => updateSFData('company', v)} />
                                            <FormInput label="CNPJ" placeholder="00.000.000/0000-00" />
                                            <FormInput label="Cargo" value={localLead.enrichedData?.jobTitle} onChange={(v) => updateSFData('jobTitle', v)} />
                                            <FormInput label="Setor" value={localLead.enrichedData?.industry || ''} onChange={(v) => updateSFData('industry', v)} />
                                            <FormSelect label="Porte da empresa" value="" options={[{ label: 'Pequena', value: 'small' }, { label: 'Média', value: 'medium' }, { label: 'Grande', value: 'large' }]} onChange={() => { }} />
                                            <FormInput label="Endereço da empresa" placeholder="Endereço comercial" />
                                            <FormInput label="Inscrição estadual" placeholder="" />
                                            <FormInput label="Site" value={localLead.enrichedData?.website || ''} onChange={(v) => updateSFData('website', v)} />
                                            <FormInput label="LinkedIn" value={localLead.enrichedData?.linkedin} onChange={(v) => updateSFData('linkedin', v)} />
                                        </ProfileSection>

                                        {/* Card 5: Oportunidade */}
                                        <ProfileSection title="Oportunidade" icon={TrendingUp} isOpen={profileSections.rd_opportunity} toggle={() => setProfileSections(prev => ({ ...prev, rd_opportunity: !prev.rd_opportunity }))}>
                                            <FormInput label="Valor do negócio" value={localLead.value} type="number" onChange={(v) => setLocalLead({ ...localLead, value: Number(v) })} />
                                            <FormInput label="Probabilidade (%)" value={localLead.probability} type="number" onChange={(v) => setLocalLead({ ...localLead, probability: Number(v) })} />
                                            <FormInput label="Data prevista de fechamento" type="date" value="" />
                                            <FormInput label="Etapa da oportunidade" value={localLead.status} readOnly />
                                            <FormInput label="Motivo ganho/perda" value={localLead.lostReason} readOnly />
                                            <FormInput label="Origem da oportunidade" value={localLead.source} readOnly />
                                            <FormInput label="Produto vinculado" value={localLead.interest} readOnly />
                                        </ProfileSection>

                                        {/* Card 6: Histórico e Atividades */}
                                        <ProfileSection title="Histórico e Atividades" icon={Clock} isOpen={profileSections.rd_history} toggle={() => setProfileSections(prev => ({ ...prev, rd_history: !prev.rd_history }))}>
                                            <div className="space-y-4">
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-500 mb-2">Últimas conversões</span>
                                                    <div className="bg-gray-50 p-2 rounded border border-gray-100 text-xs">
                                                        <div className="font-bold text-gray-700">Solicitação de Contato</div>
                                                        <div className="text-gray-500">Há 2 dias via Site</div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-500 mb-2">Últimos contatos</span>
                                                    <div className="text-xs text-gray-600">Nenhum contato recente registrado.</div>
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-500 mb-2">Interações recentes</span>
                                                    <div className="flex gap-2">
                                                        <span className="p-1.5 bg-green-100 text-green-700 rounded"><MessageCircle size={14} /></span>
                                                        <span className="p-1.5 bg-blue-100 text-blue-700 rounded"><Phone size={14} /></span>
                                                        <span className="p-1.5 bg-yellow-100 text-yellow-700 rounded"><Mail size={14} /></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 7: Campos Personalizados */}
                                        <ProfileSection title="Campos Personalizados" icon={Database} isOpen={profileSections.rd_custom} toggle={() => setProfileSections(prev => ({ ...prev, rd_custom: !prev.rd_custom }))}>
                                            <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                                <p className="text-xs text-gray-400 mb-3">Nenhum campo personalizado criado.</p>
                                                <div className="flex gap-2">
                                                    <button className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-bold text-gray-600 hover:bg-gray-50">Adicionar Campo</button>
                                                    <button className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-bold text-gray-600 hover:bg-gray-50">Criar Grupo</button>
                                                </div>
                                            </div>
                                        </ProfileSection>
                                    </div>
                                ) : activeProfile === 'PD' ? (
                                    // --- PD PROFILE LAYOUT (Pipedrive Style) ---
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                        {/* Card 1: Resumo */}
                                        <ProfileSection title="Resumo" icon={BarChart2} isOpen={profileSections.pd_summary} toggle={() => setProfileSections(prev => ({ ...prev, pd_summary: !prev.pd_summary }))}>
                                            <div className="space-y-3">
                                                <FormInput label="Valor do negócio" value={localLead.value} onChange={(v) => setLocalLead({ ...localLead, value: Number(v) })} type="number" />
                                                <FormInput label="Probabilidade (%)" value={localLead.probability} onChange={(v) => setLocalLead({ ...localLead, probability: Number(v) })} type="number" />
                                                <FormInput label="Organização" value={localLead.enrichedData?.company} onChange={(v) => updateSFData('company', v)} />
                                                <FormInput label="Pessoa de contato" value={localLead.name} readOnly />
                                                <div className="mb-3">
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Etiquetas</label>
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {localLead.tags?.map((tag, i) => (
                                                            <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded border">{tag}</span>
                                                        ))}
                                                    </div>
                                                    <input type="text" placeholder="Adicionar etiqueta..." className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white" />
                                                </div>
                                                <FormInput label="Data de fechamento esperada" value="" type="date" />
                                                <button className="w-full py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded border hover:bg-gray-200">Adicionar a uma sequência</button>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 2: Fonte */}
                                        <ProfileSection title="Fonte" icon={Globe} isOpen={profileSections.pd_source} toggle={() => setProfileSections(prev => ({ ...prev, pd_source: !prev.pd_source }))}>
                                            <FormInput label="Origem" value={localLead.source} readOnly />
                                            <FormInput label="Canal de origem" value="Web" readOnly />
                                            <FormInput label="ID do canal de origem" value={Math.floor(Math.random() * 100000).toString()} readOnly />
                                        </ProfileSection>

                                        {/* Card 3: Pessoa */}
                                        <ProfileSection title="Pessoa" icon={User} isOpen={profileSections.pd_person} toggle={() => setProfileSections(prev => ({ ...prev, pd_person: !prev.pd_person }))}>
                                            <FormInput label="Nome completo" value={localLead.name} onChange={(v) => setLocalLead({ ...localLead, name: v })} />
                                            <FormInput label="Telefone" value={localLead.phone} onChange={(v) => setLocalLead({ ...localLead, phone: v })} />
                                            <FormInput label="Email" value={localLead.email} onChange={(v) => setLocalLead({ ...localLead, email: v })} />
                                            <FormInput label="Etiquetas" placeholder="Adicionar etiqueta..." />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormInput label="Primeiro nome" value={localLead.name.split(' ')[0]} readOnly />
                                                <FormInput label="Sobrenome" value={localLead.name.split(' ').slice(1).join(' ')} readOnly />
                                            </div>
                                        </ProfileSection>

                                        {/* Card 4: Organização */}
                                        <ProfileSection title="Organização" icon={Building} isOpen={profileSections.pd_org} toggle={() => setProfileSections(prev => ({ ...prev, pd_org: !prev.pd_org }))}>
                                            <FormInput label="Nome da empresa" value={localLead.enrichedData?.company} onChange={(v) => updateSFData('company', v)} />
                                            <FormInput label="Etiquetas" placeholder="Adicionar etiqueta..." />
                                            <FormInput label="Endereço" value={localLead.address?.street} onChange={(v) => updateProfile('address', 'street', v)} />
                                            <FormInput label="Site" value={localLead.enrichedData?.website || ''} onChange={(v) => updateSFData('website', v)} />
                                            <FormInput label="Perfil do LinkedIn" value={localLead.enrichedData?.linkedin} onChange={(v) => updateSFData('linkedin', v)} />
                                            <FormInput label="Setor" value={localLead.enrichedData?.industry || ''} onChange={(v) => updateSFData('industry', v)} />
                                            <FormInput label="Receita anual" value={localLead.enrichedData?.revenue || ''} onChange={(v) => updateSFData('revenue', v)} />
                                            <FormInput label="Número de funcionários" value={localLead.enrichedData?.employees || ''} onChange={(v) => updateSFData('employees', v)} />
                                        </ProfileSection>

                                        {/* Card 5: Produto */}
                                        <ProfileSection title="Produto" icon={ShoppingBag} isOpen={profileSections.pd_product} toggle={() => setProfileSections(prev => ({ ...prev, pd_product: !prev.pd_product }))}>
                                            <div className="flex flex-col gap-2">
                                                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-black py-1 font-medium"><Plus size={16} /> Adicionar produto</button>
                                                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-black py-1 font-medium"><Plus size={16} /> Adicionar parcelamento</button>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 6: Visão Geral */}
                                        <ProfileSection title="Visão Geral" icon={Activity} isOpen={profileSections.pd_overview} toggle={() => setProfileSections(prev => ({ ...prev, pd_overview: !prev.pd_overview }))}>
                                            <div className="space-y-4">
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-500 mb-1">Idade do negócio</span>
                                                    <span className="text-sm font-bold text-gray-900">{calculateDealAge()}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-500 mb-2">Atividades principais</span>
                                                    <div className="flex gap-1 h-2 rounded overflow-hidden bg-gray-100">
                                                        <div className="bg-green-500 w-1/3"></div>
                                                        <div className="bg-blue-500 w-1/4"></div>
                                                        <div className="bg-orange-500 w-1/6"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-500 mb-2">Usuários mais ativos</span>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                                                        <span>Eduardo Santos</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-500 mb-1">Criado em</span>
                                                    <span className="text-sm text-gray-700">{new Date(localLead.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 7: Participantes */}
                                        <ProfileSection title="Participantes" icon={Users} isOpen={profileSections.pd_participants} toggle={() => setProfileSections(prev => ({ ...prev, pd_participants: !prev.pd_participants }))}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex -space-x-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold">ES</div>
                                                </div>
                                                <button className="text-xs font-bold text-blue-600 hover:underline">Ver tudo</button>
                                            </div>
                                            <button className="w-full py-2 bg-gray-50 text-gray-600 font-bold text-xs rounded border border-dashed border-gray-300 hover:bg-gray-100 flex items-center justify-center gap-1">
                                                <Plus size={14} /> Adicionar participante
                                            </button>
                                        </ProfileSection>

                                        {/* Card 8: Detalhes */}
                                        <ProfileSection title="Detalhes" icon={List} isOpen={profileSections.pd_details} toggle={() => setProfileSections(prev => ({ ...prev, pd_details: !prev.pd_details }))}>
                                            <div className="text-center py-4 text-gray-400 text-sm italic">A seção de detalhes está vazia.</div>
                                            <div className="flex flex-col sm:flex-row gap-2 mt-2">
                                                <button className="flex-1 py-1.5 bg-gray-100 text-gray-600 font-bold text-xs rounded hover:bg-gray-200">Reordenar campos</button>
                                                <button className="flex-1 py-1.5 bg-gray-100 text-gray-600 font-bold text-xs rounded hover:bg-gray-200">+ Grupo de campo</button>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 9: CCO Inteligente */}
                                        <ProfileSection title="CCO Inteligente" icon={Mail} isOpen={profileSections.pd_cco} toggle={() => setProfileSections(prev => ({ ...prev, pd_cco: !prev.pd_cco }))}>
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">Endereço específico do negócio <Info size={12} /></label>
                                                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                                                        <span className="text-xs text-gray-600 truncate flex-1">{`deal-${localLead.id}@pipedrivemail.com`}</span>
                                                        <Copy size={14} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">Endereço universal <Info size={12} /></label>
                                                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                                                        <span className="text-xs text-gray-600 truncate flex-1">company@pipedrivemail.com</span>
                                                        <Copy size={14} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                                                    </div>
                                                </div>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 10: Projects */}
                                        <ProfileSection title="Projects" icon={Briefcase} isOpen={profileSections.pd_projects} toggle={() => setProfileSections(prev => ({ ...prev, pd_projects: !prev.pd_projects }))}>
                                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                                <Box size={32} className="text-gray-300 mb-2" />
                                                <p className="text-sm text-gray-500">Este negócio não possui projetos relacionados.</p>
                                            </div>
                                        </ProfileSection>
                                    </div>
                                ) : activeProfile === 'SF' ? (
                                    // --- SF PROFILE LAYOUT (Salesforce Style) ---
                                    <>
                                        {/* Card 1: About */}
                                        <ProfileSection title="About" icon={User} isOpen={profileSections.sf_about} toggle={() => setProfileSections(prev => ({ ...prev, sf_about: !prev.sf_about }))}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                                <FormSelect label="Tratamento" value={localLead.enrichedData?.salutation || ''} options={[{ label: 'Nenhum', value: '' }, { label: 'Sr.', value: 'Mr' }, { label: 'Sra.', value: 'Ms' }, { label: 'Dr.', value: 'Dr' }]} onChange={(v) => updateSFData('salutation', v)} />
                                                <FormInput label="Primeiro Nome" value={localLead.name.split(' ')[0]} onChange={(v) => setLocalLead({ ...localLead, name: v + ' ' + (localLead.name.split(' ')[1] || '') })} />
                                                <FormInput label="Sobrenome" required value={localLead.name.split(' ').slice(1).join(' ')} onChange={(v) => setLocalLead({ ...localLead, name: localLead.name.split(' ')[0] + ' ' + v })} />
                                                <FormInput label="Nome completo" value={localLead.name} readOnly />
                                                <FormInput label="Empresa" required value={localLead.enrichedData?.company} onChange={(v) => updateSFData('company', v)} />
                                                <FormInput label="Título" value={localLead.enrichedData?.jobTitle} onChange={(v) => updateSFData('jobTitle', v)} />
                                                <FormInput label="Site da Web" value={(localLead.enrichedData as any)?.website} onChange={(v) => updateSFData('website', v)} />
                                                <FormSelect label="Status do lead" value={localLead.status} options={Object.values(LeadStatus).map(s => ({ label: s, value: s }))} onChange={(v) => setLocalLead({ ...localLead, status: v as any })} />
                                                <FormInput label="Proprietário do lead" value={assignedAgent?.name || 'Não atribuído'} readOnly />
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Descrição</label>
                                                    <textarea
                                                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:border-brand-500 outline-none bg-white resize-none"
                                                        rows={3}
                                                        value={localLead.enrichedData?.description || ''}
                                                        onChange={(e) => updateSFData('description', e.target.value)}
                                                    ></textarea>
                                                </div>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 2: Get in Touch */}
                                        <ProfileSection title="Get in Touch" icon={Phone} isOpen={profileSections.sf_contact} toggle={() => setProfileSections(prev => ({ ...prev, sf_contact: !prev.sf_contact }))}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                                <FormInput label="Telefone" value={localLead.phone} onChange={(v) => setLocalLead({ ...localLead, phone: v })} />
                                                <FormInput label="Email" value={localLead.email} onChange={(v) => setLocalLead({ ...localLead, email: v })} />

                                                <div className="md:col-span-2 mt-2 mb-2">
                                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">Endereço</h4>
                                                </div>

                                                <FormSelect label="País" value={localLead.address?.country || 'Brasil'} options={[{ label: 'Brasil', value: 'Brasil' }, { label: 'EUA', value: 'USA' }]} onChange={(v) => updateProfile('address', 'country', v)} />
                                                <FormInput label="Rua" value={localLead.address?.street} onChange={(v) => updateProfile('address', 'street', v)} />
                                                <FormInput label="Cidade" value={localLead.address?.city} onChange={(v) => updateProfile('address', 'city', v)} />
                                                <FormSelect label="Estado / Província" value={localLead.address?.state} options={[{ label: 'São Paulo', value: 'SP' }, { label: 'Rio de Janeiro', value: 'RJ' }, { label: 'Minas Gerais', value: 'MG' }]} onChange={(v) => updateProfile('address', 'state', v)} />
                                                <FormInput label="CEP" value={localLead.address?.zipCode} onChange={(v) => updateProfile('address', 'zipCode', v)} />

                                                <div className="md:col-span-2 mt-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" className="rounded text-brand-600" />
                                                        <span className="text-sm text-gray-700">Recusa de email</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 3: Segment */}
                                        <ProfileSection title="Segment" icon={PieChart} isOpen={profileSections.sf_segment} toggle={() => setProfileSections(prev => ({ ...prev, sf_segment: !prev.sf_segment }))}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                                <FormInput label="Número de funcionários" type="number" value={localLead.enrichedData?.employees || ''} onChange={(v) => updateSFData('employees', v)} />
                                                <FormInput label="Receita anual" value={localLead.enrichedData?.revenue || ''} onChange={(v) => updateSFData('revenue', v)} />
                                                <FormSelect label="Origem do lead" value={localLead.source} options={[{ label: 'Web', value: 'site' }, { label: 'Indicação por telefone', value: 'indication' }, { label: 'Parceiro', value: 'partner' }]} onChange={(v) => setLocalLead({ ...localLead, source: v as any })} />
                                                <FormSelect label="Setor" value={localLead.enrichedData?.industry || ''} options={[{ label: 'Tecnologia', value: 'tech' }, { label: 'Saúde', value: 'health' }, { label: 'Finanças', value: 'finance' }, { label: 'Varejo', value: 'retail' }]} onChange={(v) => updateSFData('industry', v)} />
                                            </div>
                                        </ProfileSection>
                                    </>
                                ) : (
                                    // --- WA PROFILE LAYOUT (Default) ---
                                    <>
                                        {/* Card 1: Dados Pessoais */}
                                        <ProfileSection title="Dados Pessoais" icon={User} isOpen={profileSections.wa_personal} toggle={() => setProfileSections(prev => ({ ...prev, wa_personal: !prev.wa_personal }))}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                                <FormInput label="Nome" value={localLead.name} onChange={(v) => setLocalLead({ ...localLead, name: v })} />
                                                <FormInput label="Telefone / WhatsApp" value={localLead.phone} onChange={(v) => setLocalLead({ ...localLead, phone: v })} />
                                                <FormInput label="Email" value={localLead.email} onChange={(v) => setLocalLead({ ...localLead, email: v })} />
                                                <FormSelect label="Sexo" value={localLead.profile?.gender || ''} options={[{ label: 'Masculino', value: 'M' }, { label: 'Feminino', value: 'F' }]} onChange={(v) => updateProfile('profile', 'gender', v)} />
                                                <FormInput label="Data de nascimento" value={localLead.profile?.birthDate} type="date" onChange={(v) => updateProfile('profile', 'birthDate', v)} />
                                                <FormSelect label="Idioma" value={localLead.profile?.language || ''} options={[{ label: 'Português', value: 'pt' }, { label: 'Inglês', value: 'en' }, { label: 'Espanhol', value: 'es' }]} onChange={(v) => updateProfile('profile', 'language', v)} />
                                            </div>
                                        </ProfileSection>

                                        {/* Card 2: Endereço */}
                                        <ProfileSection title="Endereço" icon={MapPin} isOpen={profileSections.wa_address} toggle={() => setProfileSections(prev => ({ ...prev, wa_address: !prev.wa_address }))}>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <FormInput label="País" value={localLead.address?.country || 'Brasil'} onChange={(v) => updateProfile('address', 'country', v)} />
                                                <FormInput label="Estado" value={localLead.address?.state} onChange={(v) => updateProfile('address', 'state', v)} />
                                                <FormInput label="Cidade" value={localLead.address?.city} onChange={(v) => updateProfile('address', 'city', v)} />
                                            </div>
                                            <div className="flex justify-end">
                                                <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded border hover:bg-gray-200 font-bold text-xs">Selecionar</button>
                                            </div>
                                        </ProfileSection>

                                        {/* Card 3: Informações do Lead */}
                                        <ProfileSection title="Informações do Lead" icon={Briefcase} isOpen={profileSections.wa_lead_info} toggle={() => setProfileSections(prev => ({ ...prev, wa_lead_info: !prev.wa_lead_info }))}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                                <FormSelect label="Origem do lead" value={localLead.source} options={[{ label: 'WhatsApp', value: 'whatsapp' }, { label: 'Instagram', value: 'instagram' }, { label: 'Site', value: 'site' }, { label: 'Indicação', value: 'indication' }]} onChange={(v) => setLocalLead({ ...localLead, source: v as any })} />
                                                <FormInput label="Data de entrada" value={localLead.createdAt.split('T')[0]} type="date" onChange={() => { }} />
                                                <FormInput label="Data de saída" value={(localLead as any).closedAt} type="date" onChange={() => { }} />

                                                {/* Valor do Negócio com Botão */}
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Valor do negócio</label>
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <input
                                                            type="number"
                                                            value={localLead.value || ''}
                                                            onChange={e => setLocalLead({ ...localLead, value: Number(e.target.value) })}
                                                            className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm focus:border-brand-500 outline-none bg-white"
                                                        />
                                                        <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded border hover:bg-gray-200 font-bold text-xs whitespace-nowrap">Inserir Valor</button>
                                                    </div>
                                                </div>

                                                <FormInput label="Empresa" value={localLead.enrichedData?.company} onChange={(v) => updateProfile('enrichedData', 'company', v)} />
                                                <FormInput label="Cargo" value={localLead.enrichedData?.jobTitle} onChange={(v) => updateProfile('enrichedData', 'jobTitle', v)} />
                                            </div>
                                        </ProfileSection>

                                        {/* Card 4: Produtos e Observações */}
                                        <ProfileSection title="Produtos e Observações" icon={Tag} isOpen={profileSections.wa_products} toggle={() => setProfileSections(prev => ({ ...prev, wa_products: !prev.wa_products }))}>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Produtos de interesse</label>
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <input
                                                            type="text"
                                                            value={localLead.interest || ''}
                                                            onChange={e => setLocalLead({ ...localLead, interest: e.target.value })}
                                                            className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm focus:border-brand-500 outline-none bg-white"
                                                        />
                                                        <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded border hover:bg-gray-200 font-bold text-xs">Inserir</button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Observações</label>
                                                    <textarea
                                                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:border-brand-500 outline-none bg-white resize-none"
                                                        rows={4}
                                                        value={localLead.notes?.join('\n') || ''}
                                                        onChange={(e) => setLocalLead({ ...localLead, notes: e.target.value.split('\n') })}
                                                    ></textarea>
                                                </div>
                                            </div>
                                        </ProfileSection>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    {activeMainTab === 'files' && (
                        <div className={`flex-1 flex overflow-hidden bg-slate-50 transition-all duration-300 ${isFullScreenLocal ? 'p-2' : ''}`}>
                            {/* Coluna principal */}
                            <div className={`flex-1 overflow-y-auto transition-all duration-300 ${isFullScreenLocal ? 'p-12' : 'p-10'}`}>
                                {/* Título + ações */}
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                                    <div className="bg-white shadow-sm rounded-2xl border border-slate-100 px-5 py-4 inline-flex items-center gap-3 transition-all duration-300">
                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/90 text-white">
                                            <Folder className="text-white" size={20} strokeWidth={1.5} />
                                        </span>
                                        <div>
                                            <h2 className="text-sm font-semibold text-slate-900">
                                                Documentos do negócio
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                Centralize contratos, comprovantes e arquivos importantes deste lead.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-xs font-medium bg-[#0F172A] text-white shadow-sm hover:bg-[#111827] transition-colors"
                                        >
                                            <Upload size={14} />
                                            Enviar documento
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                                        >
                                            <Plus size={14} />
                                            Nova pasta
                                        </button>
                                    </div>
                                </div>

                                {/* Filtros */}
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <div className="relative">
                                        <Search
                                            size={14}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Buscar por nome, tipo ou tag..."
                                            className="pl-10 pr-4 py-2 rounded-full border border-slate-100 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 bg-white min-w-[15rem] shadow-sm"
                                        />
                                    </div>

                                    <select className="text-xs rounded-full border border-slate-100 px-4 py-2 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200 shadow-sm">
                                        <option>Todos os tipos</option>
                                        <option>PDF</option>
                                        <option>Imagens</option>
                                        <option>Documentos</option>
                                    </select>

                                    <select className="text-xs rounded-full border border-slate-100 px-4 py-2 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200 shadow-sm">
                                        <option>Ordenar por mais recente</option>
                                        <option>Ordenar por mais antigo</option>
                                        <option>Ordenar por nome (A-Z)</option>
                                    </select>
                                </div>

                                <div className="inline-flex items-center rounded-full bg-slate-100 p-1 gap-1 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${viewMode === 'list'
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                    >
                                        Modo Lista
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('card')}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${viewMode === 'card'
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                    >
                                        Modo Card
                                    </button>
                                </div>

                                {/* BLOCO DE CARDS DE CONTAGEM - DESATIVADO TEMPORARIAMENTE
                Mantido comentado para possível uso futuro. */}
                                {/* Cards de resumo por tipo */}
                                {/*
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">
                            Documentos pessoais
                        </p>
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-semibold text-gray-900">
                                {documentTypeCount['doc'] ?? 0}
                            </p>
                            <span className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                                <FileText size={18} strokeWidth={1.5} className="text-[#0F172A]" />
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">
                            Comprovantes / PDFs
                        </p>
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-semibold text-gray-900">
                                {documentTypeCount['pdf'] ?? 0}
                            </p>
                            <span className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="h-5 w-5 text-red-600"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1.5V8h4.5L14 3.5zM7.5 14.5h2.2c1.2 0 2.1-.8 2.1-2s-.9-2-2.1-2H7.5v4zm1.3-3h.8c.5 0 .8.3.8 1s-.3 1-.8 1h-.8v-2zm4.1 3h1.3v-3h1.1c.9 0 1.6-.6 1.6-1.5S16.1 8.5 15.2 8.5h-2.3v6zm1.3-5h.8c.4 0 .7.2.7.6 0 .4-.3.6-.7.6h-.8v-1.2zm4.1 5h1.3v-2h1.6v-1.1h-1.6v-1h1.8V10h-3.1v4.5z" />
                                </svg>
                            </span>
                            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5">
                                PDF
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">
                            Imagens / Mídia
                        </p>
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-semibold text-gray-900">
                                {documentTypeCount['image'] ?? 0}
                            </p>
                            <span className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                                <Image size={18} strokeWidth={1.5} className="text-[#0F172A]" />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            */}

                                {/* Tabela / lista de documentos */}
                                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 transition-all duration-300">
                                    <div className="flex items-center justify-between px-2 py-3 border-b border-slate-50">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                                Lista de documentos
                                            </p>
                                            {totalDocuments > 0 && (
                                                <p className="text-[0.6875rem] text-slate-500">
                                                    {totalDocuments} documento(s) • Último envio em{' '}
                                                    {lastUploadLabel}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900"
                                        >
                                            Ver todos
                                        </button>
                                    </div>

                                    {totalDocuments > 0 && (
                                        <>
                                            {viewMode === 'list' && (
                                                <div className="max-h-[300px] overflow-y-auto pr-1">
                                                    {documents.map((doc) => (
                                                        <div
                                                            key={doc.id}
                                                            className="flex items-center justify-between px-2 py-3 text-sm border-b border-slate-50 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/5 text-slate-800">
                                                                    {doc.type === 'image' ? (
                                                                        <ImageIcon size={18} className="text-sky-600" />
                                                                    ) : (
                                                                        <FileText size={18} className="text-slate-700" />
                                                                    )}
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-gray-900 truncate">
                                                                        {doc.name}
                                                                    </p>
                                                                    <p className="text-[11px] text-gray-500">
                                                                        {getDocumentTypeLabel(doc.type)} •{' '}
                                                                        {new Date(doc.uploadedAt).toLocaleString('pt-BR')}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-white text-[0.6875rem] font-medium text-slate-600 border border-slate-200 shadow-xs">
                                                                    Negócio #{localLead.id}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-white text-[0.6875rem] font-medium text-slate-600 border border-slate-200 shadow-xs">
                                                                        Negócio #{localLead.id}
                                                                    </span>

                                                                    {/* Botão Ver */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const baseUrl = API_BASE_URL.replace('/api', '');
                                                                            window.open(`${baseUrl}${doc.url}`, '_blank');
                                                                        }}
                                                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-slate-200 bg-white text-[0.6875rem] text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                                                                    >
                                                                        <Eye size={14} />
                                                                        Ver
                                                                    </button>

                                                                    {/* Botão Baixar */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const baseUrl = API_BASE_URL.replace('/api', '');
                                                                            const link = document.createElement('a');
                                                                            link.href = `${baseUrl}${doc.url}`;
                                                                            link.download = doc.name;
                                                                            document.body.appendChild(link);
                                                                            link.click();
                                                                            document.body.removeChild(link);
                                                                        }}
                                                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-slate-200 bg-white text-[0.6875rem] text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                                                                    >
                                                                        <Download size={14} />
                                                                        Baixar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {viewMode === 'card' && (
                                                <div className="p-6">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        {documents.map((doc) => (
                                                            <div
                                                                key={doc.id}
                                                                className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 flex flex-col gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-[1px]"
                                                            >
                                                                <span className="h-10 w-10 rounded-full bg-slate-900/5 flex items-center justify-center text-slate-800">
                                                                    {doc.type === 'image' ? (
                                                                        <ImageIcon size={18} className="text-sky-600" />
                                                                    ) : (
                                                                        <FileText size={18} className="text-slate-700" />
                                                                    )}
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                                        {doc.name}
                                                                    </p>
                                                                    <p className="text-[0.6875rem] text-gray-500 mt-1">
                                                                        {getDocumentTypeLabel(doc.type)} •{' '}
                                                                        {new Date(doc.uploadedAt).toLocaleString('pt-BR')}
                                                                    </p>
                                                                </div>
                                                                <div className="mt-auto flex items-center gap-2">
                                                                    <a
                                                                        href={doc.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full border border-slate-200 bg-white text-[0.6875rem] text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                                                                    >
                                                                        <Download size={14} />
                                                                        Abrir
                                                                    </a>
                                                                    <a
                                                                        href={doc.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full border border-slate-200 bg-white text-[0.6875rem] text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                                                                    >
                                                                        <Download size={14} />
                                                                        Baixar
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div
                                    className={`mt-6 rounded-2xl border-2 border-dashed px-6 text-center transition-all duration-300 cursor-pointer ${isDragging
                                        ? 'border-slate-900 bg-slate-100'
                                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-50'
                                        } ${totalDocuments === 0 ? 'py-10' : 'py-4'}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="flex flex-col items-center gap-2 text-gray-600">
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-[#0F172A]">
                                            <Upload size={18} />
                                        </span>
                                        {totalDocuments === 0 ? (
                                            <>
                                                <p className="text-sm font-semibold text-gray-800">Arraste e solte arquivos aqui</p>
                                                <p className="text-xs text-gray-500">ou clique para selecionar do computador</p>
                                            </>
                                        ) : (
                                            <p className="text-xs text-gray-600">
                                                Arraste e solte arquivos aqui ou clique para selecionar do computador
                                            </p>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileInputChange}
                                    />
                                </div>
                            </div>

                        </div>
                    )}

                </div>
            </div>
        </div >
    );
};

const CRM: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [currentUser, setCurrentUser] = useState<UserType | null>(null);


    const [pipelines, setPipelines] = useState<Pipeline[]>([DEFAULT_PIPELINE]);
    const [currentPipelineId, setCurrentPipelineId] = useState<string>('default');
    const [isDirty, setIsDirty] = useState(false); // State to track if order has changed
    const pipelinesLoadedRef = useRef(false);

    const persistPipelines = async (nextPipelines: Pipeline[]) => {
        setPipelines(nextPipelines);
        localStorage.setItem('crm_pipelines', JSON.stringify(nextPipelines));
        if (!pipelinesLoadedRef.current) return;
        try {
            await api.pipelines.save(nextPipelines);
        } catch (error) {
            console.error('[CRM] Failed to save pipelines:', error);
        }
    };

    const [showMassSender, setShowMassSender] = useState(false);
    const [showLeadRoulette, setShowLeadRoulette] = useState(false);

    useEffect(() => {
        const savedSettings = localStorage.getItem('crm_settings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setShowMassSender(parsed.enableMassSender ?? false);
            setShowLeadRoulette(parsed.enableLeadRoulette ?? false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const applyPipelines = (loaded: Pipeline[]) => {
            if (!Array.isArray(loaded) || loaded.length === 0) return;
            setPipelines(loaded);
            setCurrentPipelineId((prev) => (loaded.some(p => p.id === prev) ? prev : loaded[0].id));
        };

        const loadPipelines = async () => {
            try {
                const response = await api.pipelines.getAll();
                const loaded = Array.isArray(response?.pipelines)
                    ? response.pipelines
                    : Array.isArray(response)
                        ? response
                        : [];
                if (!cancelled && loaded.length) {
                    applyPipelines(loaded);
                    localStorage.setItem('crm_pipelines', JSON.stringify(loaded));
                    pipelinesLoadedRef.current = true;
                    return;
                }
            } catch (error) {
                console.error('[CRM] Failed to load pipelines from API:', error);
            }

            if (cancelled) return;
            const cached = localStorage.getItem('crm_pipelines');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length) {
                        applyPipelines(parsed);
                    }
                } catch (error) {
                    console.error('[CRM] Failed to parse cached pipelines:', error);
                }
            }
            pipelinesLoadedRef.current = true;
        };

        loadPipelines();

        return () => {
            cancelled = true;
        };
    }, []);
    const [activeCrmTab, setActiveCrmTab] = useState<'pipeline' | 'roulette' | 'broadcast'>('pipeline');
    const [viewMode, setViewMode] = useState<'pipeline' | 'inbox'>('pipeline');
    const [showFilters, setShowFilters] = useState(false); // New state for filter toggle
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeBroadcastMode, setActiveBroadcastMode] = useState<'message' | 'campaign' | 'properties'>('message');
    const [broadcastQuery, setBroadcastQuery] = useState('');
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [selectedBroadcastIds, setSelectedBroadcastIds] = useState<string[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);

    // Grouping Mode State
    const [isGroupingMode, setIsGroupingMode] = useState(false);
    const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    // Automation State
    const [automationModalOpen, setAutomationModalOpen] = useState(false);
    const [crmSettings, setCrmSettings] = useState<CRMSettings>({ enableAutomations: false, automationStagnancyDays: 3, allowDefaultPipelineDeletion: false, enableProfileMaster: true, enableProfileWA: false, enableProfileSF: false, enableProfilePD: false, enableProfileRD: false, defaultProfile: 'MASTER', whatsappIntegrationMode: 'platform' });

    const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);
    const [editingStageId, setEditingStageId] = useState<string | null>(null);

    // NEW: Delete Confirmation State
    const [isDeleteStageModalOpen, setIsDeleteStageModalOpen] = useState(false);
    const [stageToDeleteId, setStageToDeleteId] = useState<string | null>(null);

    // Advanced Filter State
    const [filterOwner, setFilterOwner] = useState<string>('all');
    const [filterTemperature, setFilterTemperature] = useState<string>('all');
    const [filterSource, setFilterSource] = useState<string>('all');
    // New Filters
    const [filterDateStart, setFilterDateStart] = useState<string>('');
    const [filterDateEnd, setFilterDateEnd] = useState<string>('');
    const [filterValueMin, setFilterValueMin] = useState<string>('');
    const [filterValueMax, setFilterValueMax] = useState<string>('');

    // Loss Reason Modal State
    const [lossModalOpen, setLossModalOpen] = useState(false);
    const [pendingDropStatus, setPendingDropStatus] = useState<string | null>(null);
    const [selectedLossReason, setSelectedLossReason] = useState(LOSS_REASONS[0]);
    const [actionTargetId, setActionTargetId] = useState<string | null>(null);

    // Load Global Settings & Init
    useEffect(() => {
        const init = async () => {
            const user = api.auth.getCurrentUser();
            setCurrentUser(user);
            const data = await api.leads.getAll();
            setLeads(data);
            if (user?.role === 'admin' || user?.role === 'super_admin') setFilterOwner('all');
            else setFilterOwner('me');

            // Fetch Global CRM Settings & Merge with Local Storage
            try {
                // 1. Get server settings
                const apiSettings = await api.crm.getSettings();

                // 2. Get local overrides
                const localSaved = localStorage.getItem('crm_settings');
                const localSettings = localSaved ? JSON.parse(localSaved) : {};

                // 3. Merge: Defaults -> API -> Local Overrides
                const defaults: CRMSettings = {
                    enableAutomations: false,
                    automationStagnancyDays: 3,
                    allowDefaultPipelineDeletion: false,
                    enableProfileMaster: true,
                    enableProfileWA: false,
                    enableProfileSF: false,
                    enableProfilePD: false,
                    enableProfileRD: false,
                    defaultProfile: 'MASTER',
                    whatsappIntegrationMode: 'platform'
                };
                const merged = { ...defaults, ...apiSettings, ...localSettings };

                setCrmSettings(merged);
            } catch (error) {
                console.error("Failed to load settings:", error);
                // Fallback to local only
                const localSaved = localStorage.getItem('crm_settings');
                if (localSaved) {
                    setCrmSettings(JSON.parse(localSaved));
                }
            }
        };
        init();
    }, []);

    const currentPipeline = pipelines.find(p => p.id === currentPipelineId) || pipelines[0];

    // Helper to check deletion permission
    const canDeleteStage = (pipelineId: string) => {
        if (pipelineId === 'default') {
            return crmSettings.allowDefaultPipelineDeletion;
        }
        return true; // Custom pipelines can always be edited
    };

    const getVisibleLeads = () => {
        let filtered = leads;
        if (searchTerm) {
            filtered = filtered.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.email.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        filtered = filtered.filter(lead => {
            if (currentUser) {
                if (filterOwner === 'me' && lead.assignedTo !== currentUser.id) return false;
                else if (filterOwner !== 'all' && filterOwner !== 'me' && lead.assignedTo !== filterOwner) return false;
            }
            if (filterTemperature !== 'all' && lead.temperature !== filterTemperature) return false;
            if (filterSource !== 'all' && lead.source !== filterSource) return false;

            // Date Filter
            if (filterDateStart) {
                const startDate = new Date(filterDateStart);
                startDate.setHours(0, 0, 0, 0);
                const leadDate = new Date(lead.createdAt);
                if (leadDate < startDate) return false;
            }
            if (filterDateEnd) {
                const endDate = new Date(filterDateEnd);
                endDate.setHours(23, 59, 59, 999);
                const leadDate = new Date(lead.createdAt);
                if (leadDate > endDate) return false;
            }

            // Value Filter
            if (filterValueMin) {
                const min = parseFloat(filterValueMin);
                if ((lead.value || 0) < min) return false;
            }
            if (filterValueMax) {
                const max = parseFloat(filterValueMax);
                if ((lead.value || 0) > max) return false;
            }

            return true;
        });
        return filtered;
    };

    const broadcastContacts = useMemo(() => {
        const query = broadcastQuery.trim().toLowerCase();
        if (!query) return leads;
        return leads.filter(lead => (
            lead.name.toLowerCase().includes(query)
            || lead.email.toLowerCase().includes(query)
            || lead.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
        ));
    }, [broadcastQuery, leads]);

    const selectedBroadcastSet = useMemo(() => new Set(selectedBroadcastIds), [selectedBroadcastIds]);
    const allBroadcastSelected = broadcastContacts.length > 0 && broadcastContacts.every(lead => selectedBroadcastSet.has(lead.id));
    const selectedBroadcastContacts = broadcastContacts.filter(lead => selectedBroadcastSet.has(lead.id));

    const selectedCampaign = MOCK_CAMPAIGNS.find(campaign => campaign.id === selectedCampaignId) || null;
    const selectedProperties = realEstatePropertiesMock.filter(property => selectedPropertyIds.includes(property.id));

    const toggleBroadcastContact = (id: string) => {
        setSelectedBroadcastIds(prev => (
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        ));
    };

    const toggleSelectAllBroadcast = () => {
        setSelectedBroadcastIds(prev => {
            const next = new Set(prev);
            if (allBroadcastSelected) {
                broadcastContacts.forEach(contact => next.delete(contact.id));
            } else {
                broadcastContacts.forEach(contact => next.add(contact.id));
            }
            return Array.from(next);
        });
    };

    const toggleBroadcastProperty = (id: string) => {
        setSelectedPropertyIds(prev => (
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        ));
    };

    const broadcastModeLabel = activeBroadcastMode === 'message'
        ? 'Mensagem'
        : activeBroadcastMode === 'campaign'
            ? 'Campanha'
            : 'Imóveis';

    const broadcastPreview = (() => {
        if (activeBroadcastMode === 'message') {
            if (!broadcastMessage.trim()) return 'Digite uma mensagem para visualizar a prévia.';
            const firstName = selectedBroadcastContacts[0]?.name?.split(' ')[0] || 'Cliente';
            return broadcastMessage.replace(/\[Nome\]/gi, firstName);
        }
        if (activeBroadcastMode === 'campaign') {
            if (!selectedCampaign) return 'Selecione uma campanha para visualizar a prévia.';
            return `${selectedCampaign.title} — ${selectedCampaign.description}`;
        }
        if (selectedProperties.length === 0) return 'Selecione imóveis para incluir no disparo.';
        return selectedProperties.map(property => property.titulo).join(', ');
    })();

    const canSendBroadcast = selectedBroadcastIds.length > 0 && (
        (activeBroadcastMode === 'message' && broadcastMessage.trim().length > 0)
        || (activeBroadcastMode === 'campaign' && !!selectedCampaign)
        || (activeBroadcastMode === 'properties' && selectedProperties.length > 0)
    );

    const visibleLeads = getVisibleLeads();
    const pipelineValue = visibleLeads.filter(l => l.status !== LeadStatus.CLOSED && l.status !== LeadStatus.LOST && l.status !== LeadStatus.DISQUALIFIED).reduce((acc, curr) => acc + (curr.value || 0), 0);

    const handleDragStart = (id: string) => setDraggedLeadId(id);

    // Mover colunas (Reordenação)
    const moveColumn = (dragIndex: number, hoverIndex: number) => {
        const newPipelines = [...pipelines];
        const currentPipeIndex = newPipelines.findIndex(p => p.id === currentPipelineId);
        if (currentPipeIndex === -1) return;

        const currentPipe = newPipelines[currentPipeIndex];
        const newStages = [...currentPipe.stages];

        const [removed] = newStages.splice(dragIndex, 1);
        newStages.splice(hoverIndex, 0, removed);

        newPipelines[currentPipeIndex] = { ...currentPipe, stages: newStages };
        persistPipelines(newPipelines);
        setIsDirty(true); // Mark as dirty when order changes
    };

    const handleDropLead = (newStatus: string) => {
        // Check for Loss/Disqualified in default pipeline or strictly by ID
        if (newStatus === LeadStatus.LOST || newStatus === LeadStatus.DISQUALIFIED) {
            setPendingDropStatus(newStatus);
            setActionTargetId(draggedLeadId);
            setLossModalOpen(true);
        } else {
            if (draggedLeadId) executeLeadMove(draggedLeadId, newStatus as LeadStatus);
        }
    };

    const startService = (lead: Lead) => {
        executeLeadMove(lead.id, LeadStatus.TRIAGE); // Move to 'Em Atendimento'
        setSelectedLead(lead); // Open Modal immediately
        setViewMode('pipeline'); // Go to Kanban
    };

    const executeLeadMove = (id: string, newStatus: LeadStatus, reason?: string) => {
        if (id) {
            setLeads(prevLeads => prevLeads.map(l =>
                l.id === id ? { ...l, status: newStatus, lostReason: reason, lastInteraction: new Date().toISOString(), assignedTo: currentUser?.id || l.assignedTo } : l
            ));
            api.leads.updateStatus(id, newStatus);
            setDraggedLeadId(null);
            setActionTargetId(null);
        }
    };

    const confirmLoss = () => {
        if (pendingDropStatus && actionTargetId) {
            executeLeadMove(actionTargetId, pendingDropStatus as LeadStatus, selectedLossReason);
            setLossModalOpen(false);
            setPendingDropStatus(null);
            setActionTargetId(null);
        }
    };

    const handleCreatePipeline = (newPipeline: Pipeline) => {
        persistPipelines([...pipelines, newPipeline]);
        setCurrentPipelineId(newPipeline.id);
        setIsPipelineModalOpen(false);
    };

    // Function to save the reordered columns
    const handleSaveOrder = () => {
        // In a real app, this would make an API call to save the new order
        // await api.pipelines.updateOrder(currentPipeline.id, currentPipeline.stages);
        setIsDirty(false);
        alert("Ordem salva com sucesso!");
    };

    const handleAddLead = (e: React.FormEvent) => {
        e.preventDefault();
        const newLead: Lead = {
            id: `l${Date.now()}`,
            name: 'Novo Interessado',
            email: 'interessado@email.com',
            phone: '11999999999',
            status: LeadStatus.NEW,
            interest: 'Interesse Geral',
            notes: [],
            tasks: [],
            tags: [],
            createdAt: new Date().toISOString().split('T')[0],
            source: 'whatsapp',
            temperature: 'warm',
            probability: 50,
            score: 10,
            assignedTo: currentUser?.id
        };
        setLeads([newLead, ...leads]);
        setIsModalOpen(false);
        if (viewMode !== 'inbox') setViewMode('inbox');
    };

    const handleLeadUpdate = (updatedLead: Lead) => {
        setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
        setSelectedLead(updatedLead);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilterTemperature('all');
        setFilterSource('all');
        setFilterDateStart('');
        setFilterDateEnd('');
        setFilterValueMin('');
        setFilterValueMax('');
        if (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') setFilterOwner('all');
        else setFilterOwner('me');
    };

    const newLeadsInbox = visibleLeads.filter(l => l.status === LeadStatus.NEW);

    // Grouping Logic
    const handleColumnSelect = (stageId: string) => {
        if (!isGroupingMode) return;
        if (selectedStageIds.includes(stageId)) {
            // Remove if selected
            setSelectedStageIds(selectedStageIds.filter(id => id !== stageId));
        } else {
            // Add if not selected
            setSelectedStageIds([...selectedStageIds, stageId]);
        }
    };

    const handleCreateGroup = (name: string, color: string) => {
        const newGroup: PipelineGroup = {
            id: `g_${Date.now()}`,
            title: name,
            color: color,
            stageIds: selectedStageIds
        };

        const currentStages = [...currentPipeline.stages];
        const originalIndices = selectedStageIds.map(id => currentStages.findIndex(s => s.id === id)).filter(idx => idx !== -1).sort((a, b) => a - b);

        if (originalIndices.length === 0) return;

        const insertIndex = originalIndices[0];
        const selectedStagesObjects = currentStages.filter(s => selectedStageIds.includes(s.id));
        const remainingStages = currentStages.filter(s => !selectedStageIds.includes(s.id));

        remainingStages.splice(insertIndex, 0, ...selectedStagesObjects);

        const updatedPipelines = pipelines.map(p => {
            if (p.id === currentPipelineId) {
                return {
                    ...p,
                    stages: remainingStages,
                    groups: [...(p.groups || []), newGroup]
                };
            }
            return p;
        });

        persistPipelines(updatedPipelines);
        setIsGroupModalOpen(false);
        setIsGroupingMode(false);
        setSelectedStageIds([]);
        setIsDirty(true);
    };

    // ADDED: Create or Update Stage via Modal
    const handleSaveStage = (name: string, color: string) => {
        if (editingStageId) {
            // Update Existing
            const updatedPipelines = pipelines.map(p => {
                if (p.id === currentPipelineId) {
                    return {
                        ...p,
                        stages: p.stages.map(s => s.id === editingStageId ? { ...s, title: name, color: color } : s)
                    };
                }
                return p;
            });
            persistPipelines(updatedPipelines);
            setEditingStageId(null);
        } else {
            // Create New
            const newStage: PipelineStage = {
                id: `stage_${Date.now()}`,
                title: name,
                color: color // Receives full class string from modal
            };

            const updatedPipelines = pipelines.map(p => {
                if (p.id === currentPipelineId) {
                    return { ...p, stages: [...p.stages, newStage] };
                }
                return p;
            });
            persistPipelines(updatedPipelines);
        }
        setIsDirty(true);
        setIsStageModalOpen(false);
    };

    // NEW: Prompt Remove Stage (Opens Modal)
    const promptRemoveStage = (stageId: string) => {
        setStageToDeleteId(stageId);
        setIsDeleteStageModalOpen(true);
    };

    // NEW: Confirm Remove Stage (Performs Deletion)
    const confirmRemoveStage = () => {
        if (!stageToDeleteId) return;

        // 1. Remove Stage from Pipeline
        const updatedPipelines = pipelines.map(p => {
            if (p.id === currentPipelineId) {
                return {
                    ...p,
                    stages: p.stages.filter(s => s.id !== stageToDeleteId),
                    groups: p.groups?.map(g => ({
                        ...g,
                        stageIds: g.stageIds.filter(id => id !== stageToDeleteId)
                    })).filter(g => g.stageIds.length > 0)
                };
            }
            return p;
        });

        // 2. Remove Leads in that stage (Clean up associated deals)
        const updatedLeads = leads.filter(l => l.status !== stageToDeleteId);

        persistPipelines(updatedPipelines);
        setLeads(updatedLeads);
        setIsDirty(true);
        setIsDeleteStageModalOpen(false);
        setStageToDeleteId(null);
    };

    const handleEditStage = (stageId: string) => {
        setEditingStageId(stageId);
        setIsStageModalOpen(true);
    };

    // Helper function to group stages for rendering
    const groupPipelineStages = (stages: PipelineStage[], groups: PipelineGroup[] = []) => {
        const result: ({ type: 'stage', stage: PipelineStage, index: number } | { type: 'group', group: PipelineGroup, items: { stage: PipelineStage, index: number }[] })[] = [];

        let i = 0;
        while (i < stages.length) {
            const stage = stages[i];
            const group = groups.find(g => g.stageIds.includes(stage.id));

            if (group) {
                const groupItems: { stage: PipelineStage, index: number }[] = [];
                let j = i;
                while (j < stages.length) {
                    const nextStage = stages[j];
                    const nextStageGroup = groups.find(g => g.stageIds.includes(nextStage.id));
                    if (nextStageGroup?.id === group.id) {
                        groupItems.push({ stage: nextStage, index: j });
                        j++;
                    } else {
                        break;
                    }
                }

                result.push({ type: 'group', group, items: groupItems });
                i = j;
            } else {
                result.push({ type: 'stage', stage, index: i });
                i++;
            }
        }
        return result;
    };

    // Check if pipeline is empty
    const isPipelineEmpty = currentPipeline.stages.length === 0;

    // Get data for editing stage
    const editingStageData = editingStageId
        ? currentPipeline.stages.find(s => s.id === editingStageId)
        : undefined;

    return (
        <div className="h-[calc(100vh-6.25rem)] flex flex-col relative animate-fade-in">
            <div className="mb-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-2">
                    <div className="flex gap-2 overflow-x-auto">
                        <button
                            onClick={() => setActiveCrmTab('pipeline')}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition ${activeCrmTab === 'pipeline'
                                ? 'bg-brand-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Pipeline de Vendas
                        </button>
                        {showMassSender && (
                            <button
                                onClick={() => setActiveCrmTab('broadcast')}
                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${activeCrmTab === 'broadcast'
                                    ? 'bg-brand-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Rocket size={16} />
                                Disparos em Massa
                            </button>
                        )}
                        {showLeadRoulette && (
                            <button
                                onClick={() => setActiveCrmTab('roulette')}
                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition ${activeCrmTab === 'roulette'
                                    ? 'bg-brand-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                Distribuicao de Leads
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {activeCrmTab === 'pipeline' && (
                <>
                    {/* Header Controls */}
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-gray-900">Pipeline de Vendas</h2>
                                <p className="text-gray-500 text-sm">Gestão focada em atividades (Activity-Based Selling).</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm hidden md:flex">
                                    <button onClick={() => setViewMode('inbox')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'inbox' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                                        <LayoutList size={18} />
                                        {newLeadsInbox.length > 0 && <span className="bg-red-500 text-white text-[0.625rem] px-1.5 rounded-full">{newLeadsInbox.length}</span>}
                                    </button>
                                    <button onClick={() => setViewMode('pipeline')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'pipeline' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                                        <Kanban size={18} />
                                    </button>
                                </div>
                                {/* BUTTON TO CREATE NEW FUNNEL */}
                                <button onClick={() => setIsPipelineModalOpen(true)} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-colors text-sm whitespace-nowrap">
                                    <Plus size={18} className="text-brand-600" /> Novo Funil
                                </button>

                                {/* BUTTON TO CREATE GROUP */}
                                {!isGroupingMode ? (
                                    <button
                                        onClick={() => setIsGroupingMode(true)}
                                        className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
                                        disabled={isPipelineEmpty}
                                    >
                                        <Users size={18} className="text-brand-600" /> Criar Grupo
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setIsGroupingMode(false); setSelectedStageIds([]); }}
                                            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 text-sm"
                                        >
                                            Cancelar
                                        </button>
                                        {selectedStageIds.length > 0 && (
                                            <button
                                                onClick={() => setIsGroupModalOpen(true)}
                                                className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-700 flex items-center gap-2 shadow-sm text-sm animate-pulse"
                                            >
                                                <Check size={18} /> Salvar Grupo
                                            </button>
                                        )}
                                    </div>
                                )}

                                <button onClick={() => setIsModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-600/20 hover:bg-green-700 transition-colors text-sm whitespace-nowrap">
                                    <Plus size={18} /> Novo Negócio
                                </button>
                            </div>
                        </div>

                        {/* Filters Bar */}
                        <div className="flex flex-col lg:flex-row gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm items-center relative">
                            {/* Overlay Hint for Grouping Mode */}
                            {isGroupingMode && (
                                <div className="absolute inset-0 bg-brand-50/95 z-20 flex items-center justify-center text-brand-800 font-bold gap-3 backdrop-blur-sm animate-in fade-in rounded-xl">
                                    <Users size={24} />
                                    <span>Modo de Seleção Ativo: Clique nas colunas abaixo para agrupar ({selectedStageIds.length} selecionadas)</span>
                                </div>
                            )}

                            <div className="flex items-center gap-4 border-r border-gray-100 pr-4 mr-2">
                                <div>
                                    <p className="text-[0.625rem] uppercase font-bold text-gray-400 tracking-wider">Valor em Pipeline</p>
                                    <p className="font-bold text-lg text-brand-600">{pipelineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                                </div>
                            </div>
                            <div className="flex-1 flex gap-3 overflow-x-auto pb-2 lg:pb-0 w-full items-center">
                                <div className="relative min-w-[9.375rem]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 outline-none" />
                                </div>
                                {/* PIPELINE SELECTOR */}
                                <select value={currentPipelineId} onChange={(e) => setCurrentPipelineId(e.target.value)} className="bg-brand-50 border border-brand-200 text-brand-800 font-bold py-2 pl-3 pr-8 rounded-lg text-sm outline-none cursor-pointer hover:bg-brand-100 transition-colors">
                                    {pipelines.map(pipe => (
                                        <option key={pipe.id} value={pipe.id}>{pipe.title}</option>
                                    ))}
                                </select>

                                {/* FILTER TOGGLE BUTTON */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${showFilters ? 'bg-brand-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <List size={18} /> Filtrar
                                </button>

                                {/* FILTERS POPOVER */}
                                {showFilters && (
                                    <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-xl shadow-xl p-4 flex flex-col gap-3 z-50 min-w-[200px] animate-fade-in">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Filtros</span>
                                            <button onClick={() => setShowFilters(false)}><X size={14} className="text-gray-400 hover:text-gray-600" /></button>
                                        </div>

                                        {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-medium text-gray-600">Responsável</label>
                                                <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 rounded-lg text-sm font-medium outline-none w-full">
                                                    <option value="all">Todos</option>
                                                    <option value="me">Meus Negócios</option>
                                                    {MOCK_USERS.filter(u => u.role === 'agent').map(agent => (
                                                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-600">Temperatura</label>
                                            <select value={filterTemperature} onChange={(e) => setFilterTemperature(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 rounded-lg text-sm font-medium outline-none w-full">
                                                <option value="all">Todas</option>
                                                <option value="hot">🔥 Quentes</option>
                                                <option value="warm">☀️ Mornos</option>
                                                <option value="cold">❄️ Frios</option>
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-600">Origem</label>
                                            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 rounded-lg text-sm font-medium outline-none w-full">
                                                <option value="all">Todas</option>
                                                <option value="whatsapp">WhatsApp</option>
                                                <option value="instagram">Instagram</option>
                                                <option value="site">Site</option>
                                            </select>
                                        </div>

                                        <div className="border-t border-gray-100 my-1"></div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-600">Período (Criação)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="date"
                                                    value={filterDateStart}
                                                    onChange={(e) => setFilterDateStart(e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-2 rounded-lg text-xs font-medium outline-none"
                                                    placeholder="De"
                                                />
                                                <input
                                                    type="date"
                                                    value={filterDateEnd}
                                                    onChange={(e) => setFilterDateEnd(e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-2 rounded-lg text-xs font-medium outline-none"
                                                    placeholder="Até"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-600">Valor do Negócio (R$)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={filterValueMin}
                                                    onChange={(e) => setFilterValueMin(e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-2 rounded-lg text-xs font-medium outline-none"
                                                    placeholder="Mín"
                                                />
                                                <input
                                                    type="number"
                                                    value={filterValueMax}
                                                    onChange={(e) => setFilterValueMax(e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-2 rounded-lg text-xs font-medium outline-none"
                                                    placeholder="Máx"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={resetFilters}
                                            className="mt-2 w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            <RotateCcw size={12} /> Limpar Filtros
                                        </button>
                                    </div>
                                )}

                                {/* SAVE ORDER BUTTON */}
                                <button
                                    onClick={handleSaveOrder}
                                    disabled={!isDirty}
                                    title={isDirty ? "Salvar ordem" : "Nenhuma alteração"}
                                    className={`p-2 rounded-lg transition-colors ${isDirty ? 'bg-green-600 text-white shadow-md hover:bg-green-700 animate-pulse' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                                >
                                    <Save size={18} />
                                </button>


                            </div>
                        </div>
                    </div>

                    {/* INBOX MODE */}
                    {viewMode === 'inbox' && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col animate-fade-in">
                            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                        <Clock className="text-brand-600" /> Caixa de Entrada
                                    </h3>
                                    <p className="text-sm text-gray-500">Leads novos sem dono ou qualificação.</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {newLeadsInbox.map(lead => (
                                    <div key={lead.id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-brand-200 hover:shadow-md rounded-xl transition-all group">
                                        <div className="flex-1">
                                            <LeadCard lead={lead} compact={true} onClick={() => setSelectedLead(lead)} />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => startService(lead)}
                                                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-bold shadow-lg shadow-green-600/20"
                                                title="Iniciar Atendimento e Mover para Funil"
                                            >
                                                <MessageCircle size={18} /> Iniciar Atendimento
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {newLeadsInbox.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                        <CheckCircle size={48} className="mb-4 text-green-200" />
                                        <p>Caixa de entrada limpa!</p>
                                        <p className="text-xs">Bom trabalho.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PIPELINE MODE (Dynamic Columns with Grouping) */}
                    {viewMode === 'pipeline' && (
                        <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar animate-fade-in relative h-full">

                            {/* EMPTY STATE - Centralized Button */}
                            {isPipelineEmpty && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                                    <div className="bg-gray-50 p-8 rounded-full mb-6">
                                        <GitCommit size={64} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Este funil está vazio</h3>
                                    <p className="text-gray-500 mb-8 max-w-md">Comece criando etapas para organizar seu processo de vendas de forma eficiente.</p>
                                    <button
                                        onClick={() => { setEditingStageId(null); setIsStageModalOpen(true); }}
                                        className="bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-brand-700 shadow-xl shadow-brand-600/20 flex items-center gap-3 transition-transform hover:scale-105"
                                    >
                                        <Plus size={24} /> Adicionar Pipeline
                                    </button>
                                </div>
                            )}

                            {/* PIPELINE COLUMNS */}
                            {!isPipelineEmpty && (
                                <div className="flex gap-4 h-full min-w-max px-1 pt-6">
                                    {groupPipelineStages(currentPipeline.stages, currentPipeline.groups).map((item) => {
                                        if (item.type === 'group') {
                                            // Render encapsulated group (Minimalist & Clean)
                                            return (
                                                <div key={item.group.id} className="flex flex-col mr-4 h-full relative group/pipeline-group pt-2 pb-2">
                                                    {/* Premium Background Area - Subtle tint behind columns */}
                                                    <div
                                                        className="absolute inset-0 rounded-2xl border border-transparent transition-all duration-300 pointer-events-none"
                                                        style={{
                                                            backgroundColor: `${item.group.color}08`, // Very subtle tint (approx 3% opacity)
                                                        }}
                                                    />

                                                    {/* Header Visuals */}
                                                    <div className="mb-4 pl-3 relative z-10">
                                                        <div className="flex items-center gap-3">
                                                            {/* Floating Tag */}
                                                            <div
                                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[0.6875rem] font-semibold tracking-wide shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:brightness-95 backdrop-blur-sm"
                                                                style={{
                                                                    backgroundColor: '#ffffff', // White background for clean look
                                                                    color: item.group.color,
                                                                    borderColor: `${item.group.color}30`, // Soft border
                                                                }}
                                                            >
                                                                <Layers size={12} strokeWidth={2.5} className="opacity-80" />
                                                                <span className="uppercase tracking-wider">{item.group.title}</span>
                                                            </div>

                                                            {/* The Elegant Line */}
                                                            <div
                                                                className="h-[1.5px] flex-1 rounded-full opacity-30 origin-left transition-all duration-500 group-hover/pipeline-group:opacity-50"
                                                                style={{
                                                                    backgroundColor: item.group.color,
                                                                    boxShadow: `0 1px 2px ${item.group.color}20` // Subtle glow
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Columns Container - Added padding for the group background effect */}
                                                    <div className="flex gap-4 h-full px-2 relative z-10">
                                                        {item.items.map(subItem => {
                                                            const isSelected = selectedStageIds.includes(subItem.stage.id);
                                                            const selectionIdx = selectedStageIds.indexOf(subItem.stage.id);
                                                            return (
                                                                <LeadColumn
                                                                    key={subItem.stage.id}
                                                                    index={subItem.index}
                                                                    status={subItem.stage.id}
                                                                    title={subItem.stage.title}
                                                                    color={subItem.stage.color}
                                                                    leads={visibleLeads}
                                                                    onDrop={handleDropLead}
                                                                    onDragStart={handleDragStart}
                                                                    onLeadClick={setSelectedLead}
                                                                    moveColumn={moveColumn}
                                                                    isGroupingMode={isGroupingMode}
                                                                    selectionIndex={isSelected ? selectionIdx : undefined}
                                                                    onColumnSelect={handleColumnSelect}
                                                                    onRemoveStage={promptRemoveStage}
                                                                    onEditStage={handleEditStage}
                                                                    canDelete={canDeleteStage(currentPipelineId)}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            // Render individual stage
                                            const isSelected = selectedStageIds.includes(item.stage.id);
                                            const selectionIdx = selectedStageIds.indexOf(item.stage.id);
                                            return (
                                                <LeadColumn
                                                    key={item.stage.id}
                                                    index={item.index}
                                                    status={item.stage.id}
                                                    title={item.stage.title}
                                                    color={item.stage.color}
                                                    leads={visibleLeads}
                                                    onDrop={handleDropLead}
                                                    onDragStart={setDraggedLeadId}
                                                    onLeadClick={setSelectedLead}
                                                    moveColumn={moveColumn}
                                                    isGroupingMode={isGroupingMode}
                                                    selectionIndex={isSelected ? selectionIdx : undefined}
                                                    onColumnSelect={handleColumnSelect}
                                                    onRemoveStage={promptRemoveStage}
                                                    onEditStage={handleEditStage}
                                                    canDelete={canDeleteStage(currentPipelineId)}
                                                />
                                            );
                                        }
                                    })}

                                    {/* ADD NEW STAGE BUTTON - End of List */}
                                    <div className="pt-2 pb-2 h-full flex flex-col min-w-[17.5rem]">
                                        {/* Spacer for alignment with headers */}
                                        <div className="h-[2.625rem] mb-1"></div>
                                        <button
                                            onClick={() => { setEditingStageId(null); setIsStageModalOpen(true); }}
                                            className="flex-1 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-all cursor-pointer group"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                                                    <Plus size={24} />
                                                </div>
                                                <span className="font-bold text-sm">Adicionar Pipeline</span>
                                            </div>
                                        </button>
                                    </div>

                                </div>
                            )}
                        </div>
                    )}

                    {/* MODALS */}
                    {isPipelineModalOpen && (
                        <PipelineEditorModal
                            onClose={() => setIsPipelineModalOpen(false)}
                            onSave={handleCreatePipeline}
                        />
                    )}

                    {isGroupModalOpen && (
                        <GroupEditorModal
                            onClose={() => setIsGroupModalOpen(false)}
                            onSave={handleCreateGroup}
                        />
                    )}

                    {isStageModalOpen && (
                        <StageEditorModal
                            onClose={() => { setIsStageModalOpen(false); setEditingStageId(null); }}
                            onSave={handleSaveStage}
                            initialData={editingStageData ? { name: editingStageData.title, color: editingStageData.color } : undefined}
                        />
                    )}

                    {/* DELETE CONFIRMATION MODAL */}
                    {isDeleteStageModalOpen && (
                        <div className="absolute inset-0 z-[70] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
                                <div className="text-center mb-6">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500">
                                        <Trash2 size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Excluir Etapa?</h3>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Tem certeza que deseja excluir esta pipeline? <br />
                                        <strong>Essa ação removerá a etapa e todos os {leads.filter(l => l.status === stageToDeleteId).length} negócios que estiverem nela.</strong>
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => { setIsDeleteStageModalOpen(false); setStageToDeleteId(null); }} className="flex-1 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
                                    <button onClick={confirmRemoveStage} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">Excluir</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ... Rest of modals (LossReason, LeadDetail, etc.) unchanged ... */}
                    {isModalOpen && (
                        <div className="absolute inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-900">Novo Negócio</h3>
                                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                                </div>
                                <form onSubmit={handleAddLead} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Contato</label>
                                        <input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="Nome" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Telefone</label>
                                        <input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="(00) 00000-0000" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Imóvel de Interesse</label>
                                        <input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="Ex: Apartamento Centro" />
                                    </div>
                                    <button className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700">Criar Negócio</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {lossModalOpen && (
                        <div className="absolute inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border-2 border-red-100">
                                <div className="text-center mb-6">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Motivo da Perda</h3>
                                    <p className="text-sm text-gray-500">Por que este negócio não avançou?</p>
                                </div>

                                <div className="space-y-2 mb-6">
                                    {LOSS_REASONS.map(reason => (
                                        <label key={reason} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                            <input
                                                type="radio"
                                                name="lossReason"
                                                className="text-brand-600 focus:ring-brand-500"
                                                checked={selectedLossReason === reason}
                                                onChange={() => setSelectedLossReason(reason)}
                                            />
                                            <span className="text-sm font-medium text-gray-700">{reason}</span>
                                        </label>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setLossModalOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
                                    <button onClick={confirmLoss} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">Confirmar</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedLead && (
                        <LeadDetailModal
                            lead={selectedLead}
                            pipeline={currentPipeline}
                            onClose={() => setSelectedLead(null)}
                            onUpdate={handleLeadUpdate}
                            crmSettings={crmSettings}
                            setAutomationModalOpen={setAutomationModalOpen}
                        />
                    )}
                </>
            )}

            {activeCrmTab === 'broadcast' && (
                <div className="flex-1 flex flex-col">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex-1 flex flex-col">
                        <div className="flex flex-col gap-2 mb-6">
                            <div className="flex items-center gap-2 text-slate-900">
                                <Rocket size={18} className="text-brand-600" />
                                <h2 className="text-2xl font-serif font-bold">Disparos em Massa</h2>
                            </div>
                            <p className="text-sm text-slate-500">
                                Selecione contatos, defina o conteúdo e revise a prévia antes de enviar.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-0">
                            <div className="xl:col-span-3 flex flex-col min-h-0">
                                <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex flex-col min-h-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">Contatos</h3>
                                            <p className="text-xs text-slate-500">{broadcastContacts.length} contatos</p>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-600">
                                            {selectedBroadcastIds.length} selecionados
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar contatos..."
                                                value={broadcastQuery}
                                                onChange={(event) => setBroadcastQuery(event.target.value)}
                                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200 bg-white"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={toggleSelectAllBroadcast}
                                            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white"
                                        >
                                            {allBroadcastSelected ? 'Limpar' : 'Todos'}
                                        </button>
                                    </div>

                                    <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-2">
                                        {broadcastContacts.length === 0 && (
                                            <div className="text-xs text-slate-500 text-center py-8">
                                                Nenhum contato encontrado.
                                            </div>
                                        )}
                                        {broadcastContacts.map(lead => {
                                            const isSelected = selectedBroadcastSet.has(lead.id);
                                            return (
                                                <button
                                                    key={lead.id}
                                                    type="button"
                                                    onClick={() => toggleBroadcastContact(lead.id)}
                                                    className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left transition ${isSelected
                                                        ? 'border-brand-500 bg-brand-50/60'
                                                        : 'border-slate-200 hover:bg-white'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleBroadcastContact(lead.id)}
                                                        onClick={(event) => event.stopPropagation()}
                                                        className="h-4 w-4 rounded border-slate-300 text-brand-600"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 truncate">{lead.name}</p>
                                                        <p className="text-xs text-slate-500 truncate">{lead.email || lead.phone}</p>
                                                    </div>
                                                    <span className="ml-auto text-[0.625rem] uppercase tracking-wide text-slate-400">
                                                        {lead.source}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="xl:col-span-6 flex flex-col min-h-0">
                                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col min-h-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">Conteúdo do disparo</h3>
                                            <p className="text-xs text-slate-500">Mensagem, campanha ou imóveis.</p>
                                        </div>
                                        <div className="inline-flex items-center rounded-full bg-slate-100 p-1 gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setActiveBroadcastMode('message')}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${activeBroadcastMode === 'message'
                                                    ? 'bg-white text-slate-900 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                Mensagem
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveBroadcastMode('campaign')}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${activeBroadcastMode === 'campaign'
                                                    ? 'bg-white text-slate-900 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                Campanhas
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveBroadcastMode('properties')}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${activeBroadcastMode === 'properties'
                                                    ? 'bg-white text-slate-900 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                Imóveis
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex-1 overflow-y-auto pr-1">
                                        {activeBroadcastMode === 'message' && (
                                            <div className="space-y-4">
                                                <FormInput
                                                    label="Título interno"
                                                    value={broadcastTitle}
                                                    onChange={setBroadcastTitle}
                                                    placeholder="Ex: Campanha de Maio"
                                                />
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Mensagem</label>
                                                    <textarea
                                                        value={broadcastMessage}
                                                        onChange={(event) => setBroadcastMessage(event.target.value)}
                                                        placeholder="Olá [Nome], temos novidades para você!"
                                                        rows={8}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white resize-none focus:border-brand-500"
                                                    />
                                                    <div className="mt-2 flex flex-wrap gap-2 text-[0.6875rem] text-slate-500">
                                                        <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">[Nome]</span>
                                                        <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">[Imóvel]</span>
                                                        <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">[Corretor]</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeBroadcastMode === 'campaign' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {MOCK_CAMPAIGNS.map((campaign) => {
                                                    const isSelected = campaign.id === selectedCampaignId;
                                                    return (
                                                        <button
                                                            key={campaign.id}
                                                            type="button"
                                                            onClick={() => setSelectedCampaignId(campaign.id)}
                                                            className={`text-left border rounded-2xl overflow-hidden transition ${isSelected
                                                                ? 'border-brand-500 bg-brand-50/40'
                                                                : 'border-slate-200 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            <div className="h-24 w-full overflow-hidden bg-slate-100">
                                                                <img src={campaign.image} alt={campaign.title} className="h-full w-full object-cover" />
                                                            </div>
                                                            <div className="p-3">
                                                                <p className="text-sm font-bold text-slate-900">{campaign.title}</p>
                                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{campaign.description}</p>
                                                                <span className="mt-2 inline-flex text-[0.625rem] font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-full">
                                                                    {campaign.active ? 'Ativa' : 'Pausada'}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {activeBroadcastMode === 'properties' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {realEstatePropertiesMock.slice(0, 8).map(property => {
                                                    const isSelected = selectedPropertyIds.includes(property.id);
                                                    return (
                                                        <button
                                                            key={property.id}
                                                            type="button"
                                                            onClick={() => toggleBroadcastProperty(property.id)}
                                                            className={`text-left border rounded-2xl p-3 flex gap-3 items-start transition ${isSelected
                                                                ? 'border-brand-500 bg-brand-50/40'
                                                                : 'border-slate-200 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                                <Home size={16} className="text-slate-400" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-slate-900 truncate">{property.titulo}</p>
                                                                <p className="text-xs text-slate-500 truncate">{property.cidade}/{property.estado}</p>
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleBroadcastProperty(property.id)}
                                                                onClick={(event) => event.stopPropagation()}
                                                                className="h-4 w-4 ml-auto rounded border-slate-300 text-brand-600"
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="xl:col-span-3 flex flex-col min-h-0">
                                <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex flex-col min-h-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">Resumo do disparo</h3>
                                            <p className="text-xs text-slate-500">Confirme antes de enviar.</p>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-600">{broadcastModeLabel}</span>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        <div className="bg-white border border-slate-200 rounded-xl p-3">
                                            <p className="text-[0.6875rem] text-slate-500">Contatos selecionados</p>
                                            <p className="text-lg font-bold text-slate-900">{selectedBroadcastIds.length}</p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {selectedBroadcastContacts.slice(0, 3).map(contact => (
                                                    <span key={contact.id} className="text-[0.625rem] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full">
                                                        {contact.name.split(' ')[0]}
                                                    </span>
                                                ))}
                                                {selectedBroadcastContacts.length > 3 && (
                                                    <span className="text-[0.625rem] font-semibold text-slate-500">
                                                        +{selectedBroadcastContacts.length - 3} outros
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-xl p-3">
                                            <p className="text-[0.6875rem] text-slate-500">Prévia do conteúdo</p>
                                            <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{broadcastPreview}</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 flex flex-col gap-2">
                                        <button
                                            type="button"
                                            disabled={!canSendBroadcast}
                                            className={`w-full py-2 rounded-xl text-xs font-bold transition ${canSendBroadcast
                                                ? 'bg-brand-600 text-white hover:bg-brand-700'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            Disparar campanha
                                        </button>
                                        <button
                                            type="button"
                                            className="w-full py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-white"
                                        >
                                            Salvar rascunho
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeCrmTab === 'roulette' && <LeadRoulette />}

            {/* AUTOMATION MODAL */}
            {automationModalOpen && selectedLead && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="bg-indigo-600 p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Bot size={120} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Sparkles size={24} className="text-yellow-300" /> Central de Automação
                                </h3>
                                <p className="text-indigo-100 text-sm mt-1">Assistente inteligente para vendas</p>
                            </div>
                            <button onClick={() => setAutomationModalOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* DIAGNOSTIC */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Diagnóstico do Lead</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-gray-600 font-bold text-lg min-w-[3rem] text-center">
                                            {Math.floor((new Date().getTime() - new Date(selectedLead.createdAt).getTime()) / (1000 * 3600 * 24))}d
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Dias na base</p>
                                            <p className="text-xs text-gray-500">Desde o cadastro</p>
                                        </div>
                                    </div>

                                    {/* Interaction Check */}
                                    {(() => {
                                        // Mock calculation - in real app use lastInteraction field
                                        const daysSinceInteraction = Math.floor(Math.random() * 10); // Random for demo
                                        const isStagnant = daysSinceInteraction >= crmSettings.automationStagnancyDays;

                                        return (
                                            <div className={`flex items-center gap-3 p-3 rounded-xl border ${isStagnant ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                                <div className={`p-2 rounded-lg shadow-sm font-bold text-lg min-w-[3rem] text-center ${isStagnant ? 'bg-white text-red-600' : 'bg-white text-green-600'}`}>
                                                    {daysSinceInteraction}d
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${isStagnant ? 'text-red-700' : 'text-green-700'}`}>
                                                        {isStagnant ? 'Lead Estagnado ⚠️' : 'Situação Ativa ✅'}
                                                    </p>
                                                    <p className={`text-xs ${isStagnant ? 'text-red-600' : 'text-green-600'}`}>
                                                        {isStagnant ? `Sem interação há mais de ${crmSettings.automationStagnancyDays} dias` : 'Interação recente detectada'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* ACTIONS */}
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ações Sugeridas (WhatsApp)</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <a
                                    href={`https://wa.me/55${selectedLead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${selectedLead.name.split(' ')[0]}, tudo bem? Notei que faz um tempo que não nos falamos sobre seu interesse no imóvel. Ainda está buscando?`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-4 bg-white border border-gray-200 hover:border-brand-300 hover:shadow-md rounded-xl transition-all group"
                                >
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <RotateCcw size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="font-bold text-gray-900 text-sm group-hover:text-brand-700">Reativar Lead Parado</h5>
                                        <p className="text-xs text-gray-500">"Notei que faz um tempo que não nos falamos..."</p>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-500" />
                                </a>

                                <a
                                    href={`https://wa.me/55${selectedLead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Oi ${selectedLead.name.split(' ')[0]}! Conseguimos uma condição especial para aquele imóvel que você gostou. Podemos conversar?`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-4 bg-white border border-gray-200 hover:border-brand-300 hover:shadow-md rounded-xl transition-all group"
                                >
                                    <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                                        <Zap size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="font-bold text-gray-900 text-sm group-hover:text-brand-700">Oferta Especial</h5>
                                        <p className="text-xs text-gray-500">"Conseguimos uma condição especial..."</p>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-500" />
                                </a>

                                <a
                                    href={`https://wa.me/55${selectedLead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${selectedLead.name.split(' ')[0]}, tentei contato anteriormente. Você prefere que eu ligue em outro horário?`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-4 bg-white border border-gray-200 hover:border-brand-300 hover:shadow-md rounded-xl transition-all group"
                                >
                                    <div className="p-2 bg-gray-50 text-gray-600 rounded-lg group-hover:bg-gray-600 group-hover:text-white transition-colors">
                                        <Phone size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="font-bold text-gray-900 text-sm group-hover:text-brand-700">Tentativa de Contato</h5>
                                        <p className="text-xs text-gray-500">"Você prefere que eu ligue em outro horário?"</p>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-500" />
                                </a>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
                            <p className="text-[0.625rem] text-gray-400">As mensagens abrem diretamente no seu WhatsApp Web/Desktop.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRM;
