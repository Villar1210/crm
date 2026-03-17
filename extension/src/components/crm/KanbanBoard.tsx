import { useState, useEffect } from 'react';

type KanbanCard = {
    id: string;
    title: string;
    value: string;
    temperature: 'hot' | 'warm' | 'cold';
    avatar?: string;
};

type KanbanColumn = {
    id: string;
    label: string;
    cards: KanbanCard[];
};

const MOCK_BOARD: KanbanColumn[] = [
    {
        id: 'new',
        label: 'Novos Leads',
        cards: [
            { id: '1', title: 'Bruno Silva', value: 'R$ 450k', temperature: 'hot' },
            { id: '2', title: 'Carla Dias', value: 'R$ 320k', temperature: 'warm' },
        ]
    },
    {
        id: 'open',
        label: 'Em Atendimento',
        cards: [
            { id: '3', title: 'Felipe Costa', value: 'R$ 800k', temperature: 'cold' },
        ]
    },
    {
        id: 'visit',
        label: 'Agendou Visita',
        cards: [
            { id: '4', title: 'Ana Julia', value: 'R$ 1.2M', temperature: 'hot' },
        ]
    },
    {
        id: 'proposal',
        label: 'Proposta',
        cards: []
    },
    {
        id: 'closed',
        label: 'Fechado',
        cards: [
            { id: '5', title: 'Roberto M.', value: 'R$ 550k', temperature: 'hot' },
        ]
    }
];

export function KanbanBoard() {
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedItem, setDraggedItem] = useState<{ colIdx: number; cardIdx: number } | null>(null);

    // Load from storage
    useEffect(() => {
        chrome.storage.local.get('crm_kanban_board').then(res => {
            if (res.crm_kanban_board) {
                setColumns(res.crm_kanban_board as any);
            } else {
                setColumns(MOCK_BOARD);
            }
            setLoading(false);
        });
    }, []);

    // Save to storage
    const saveBoard = (newCols: KanbanColumn[]) => {
        setColumns(newCols);
        chrome.storage.local.set({ crm_kanban_board: newCols });
    };

    const handleDragStart = (e: React.DragEvent, colIdx: number, cardIdx: number) => {
        setDraggedItem({ colIdx, cardIdx });
        // Effect to make ghost image look better if needed
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Essential to allow dropping
    };

    const handleDrop = (e: React.DragEvent, targetColIdx: number) => {
        e.preventDefault();

        if (!draggedItem) return;
        const { colIdx: sourceColIdx, cardIdx: sourceCardIdx } = draggedItem;

        // If dropped in same column, we could reorder, but for now just ignore to keep simple
        if (sourceColIdx === targetColIdx) {
            setDraggedItem(null);
            return;
        }

        const newCols = [...columns];
        const sourceCards = [...newCols[sourceColIdx].cards];
        const targetCards = [...newCols[targetColIdx].cards];

        const [movedCard] = sourceCards.splice(sourceCardIdx, 1);
        targetCards.push(movedCard);

        newCols[sourceColIdx] = { ...newCols[sourceColIdx], cards: sourceCards };
        newCols[targetColIdx] = { ...newCols[targetColIdx], cards: targetCards };

        saveBoard(newCols);
        setDraggedItem(null);
    };

    if (loading) return <div className="p-8 text-center text-slate-400 text-xs">Carregando Kanban...</div>;

    return (
        <div className="h-full bg-slate-100 flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-white">
                <h2 className="font-display text-lg font-bold text-slate-900">Pipeline de Vendas</h2>
                <p className="text-xs text-slate-500">Arraste os cards para mudar de etapa.</p>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex gap-4 custom-scrollbar">
                {columns.map((col, colIdx) => (
                    <div
                        key={col.id}
                        className={`min-w-[260px] w-[260px] flex flex-col h-full rounded-xl border transition-colors ${draggedItem && draggedItem.colIdx !== colIdx ? 'bg-brand-50/50 border-brand-200 border-dashed' : 'bg-slate-50/50 border-slate-200'}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, colIdx)}
                    >
                        {/* Column Header */}
                        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
                            <h3 className="text-xs font-bold uppercase text-slate-600">{col.label}</h3>
                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold">{col.cards.length}</span>
                        </div>

                        {/* Cards Container */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {col.cards.map((card, cardIdx) => (
                                <div
                                    key={card.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, colIdx, cardIdx)}
                                    className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all group animate-panel-in"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                {card.title[0]}
                                            </div>
                                            <span className="font-bold text-xs text-slate-800">{card.title}</span>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${card.temperature === 'hot' ? 'bg-rose-500' : card.temperature === 'warm' ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                                        <span>Valor:</span>
                                        <span className="font-semibold text-slate-700">{card.value}</span>
                                    </div>
                                </div>
                            ))}
                            {col.cards.length === 0 && (
                                <div className="h-20 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-400 pointer-events-none">
                                    Solte aqui
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Spacer for right padding */}
                <div className="min-w-[20px]"></div>
            </div>
        </div>
    );
}
