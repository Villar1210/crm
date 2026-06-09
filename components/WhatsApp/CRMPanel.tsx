import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, PhoneCall, Calendar, DollarSign, StickyNote, X, Check, Loader2, ExternalLink } from 'lucide-react';
import { WhatsAppChat } from '../../types';
import { API_BASE_URL } from '../../services/apiConfig';

// Pipeline stages — must match DEFAULT_PIPELINE in constants.ts exactly
// 'Novo' is NOT in DEFAULT_PIPELINE columns, so we start with 'Em Triagem'
const PIPELINE_STAGES = [
    { id: 'Em Triagem',       label: 'Em Atendimento',    color: '#3b82f6' },
    { id: 'Qualificado',      label: 'Qualificado',       color: '#06b6d4' },
    { id: 'Visita Agendada',  label: 'Visita Agendada',   color: '#8b5cf6' },
    { id: 'Proposta',         label: 'Proposta',          color: '#f59e0b' },
    { id: 'Negociação',       label: 'Negociação',        color: '#f97316' },
    { id: 'Vendido',          label: 'Vendido',           color: '#22c55e' },
    { id: 'Não Qualificado',  label: 'Não Qualificado',   color: '#9ca3af' },
    { id: 'Perdido',          label: 'Perdido',           color: '#ef4444' },
];

interface ScheduleModalProps {
    chat: WhatsAppChat;
    onClose: () => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ chat, onClose }) => {
    const [title, setTitle] = useState(`Visita — ${chat.name || chat.phoneNumber}`);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const save = async () => {
        if (!date || !time) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const dueDate = new Date(`${date}T${time}`).toISOString();
            await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title, dueDate, type: 'meeting', notes }),
            });
            setSaved(true);
            setTimeout(onClose, 1200);
        } catch {
            /* ignore */
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/20" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-80 m-4 p-5 border border-gray-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" /> Agendar compromisso
                    </h3>
                    <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
                </div>
                <div className="space-y-3">
                    <input value={title} onChange={e => setTitle(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Título" />
                    <div className="flex gap-2">
                        <input type="date" value={date} onChange={e => setDate(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        <input type="time" value={time} onChange={e => setTime(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Observações..." />
                </div>
                <button onClick={save} disabled={!date || !time || saving}
                    className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                    {saving ? 'Salvando...' : saved ? 'Agendado!' : 'Confirmar agendamento'}
                </button>
            </div>
        </div>
    );
};

interface CRMPanelProps {
    chat: WhatsAppChat | null;
    isVisible: boolean;
    onClose: () => void;
}

export const CRMPanel: React.FC<CRMPanelProps> = ({ chat, isVisible, onClose }) => {
    const [stage, setStage] = useState('Em Triagem');
    const [dealValue, setDealValue] = useState('0,00');
    const [notes, setNotes] = useState('');
    const [stageSaving, setStageSaving] = useState(false);
    const [stageSaved, setStageSaved] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [leadId, setLeadId] = useState<string | null>(null);
    const [showStageDropdown, setShowStageDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowStageDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Load lead data when chat changes
    useEffect(() => {
        if (!chat) return;
        setStage('Em Triagem');
        setDealValue('0,00');
        setNotes('');
        setLeadId(null);

        const token = localStorage.getItem('token');
        const phone = chat.phoneNumber?.replace(/\D/g, '');
        if (!phone) return;

        // Search lead by phone (API requires phone or ownerId param)
        fetch(`${API_BASE_URL}/leads?phone=${encodeURIComponent(phone)}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(d => {
                const leads = Array.isArray(d) ? d : (d.leads || []);
                if (leads.length > 0) {
                    const lead = leads[0];
                    setLeadId(lead.id);
                    if (lead.status) setStage(lead.status);
                    if (lead.value != null) setDealValue(String(lead.value).replace('.', ','));
                    if (lead.notes && Array.isArray(lead.notes) && lead.notes.length > 0) setNotes(lead.notes.join('\n'));
                    else if (typeof lead.notes === 'string' && lead.notes) setNotes(lead.notes);
                }
            })
            .catch(() => {});
    }, [chat?.id]);

    const saveStage = async (newStage: string) => {
        setStage(newStage);
        setShowStageDropdown(false);
        setStageSaved(false);
        setStageSaving(true);

        const token = localStorage.getItem('token');

        // Decode userId from JWT
        let userId: string | null = null;
        try {
            const payload = JSON.parse(atob(token!.split('.')[1]));
            userId = payload.userId || null;
        } catch { /* ignore */ }

        const phone = chat?.phoneNumber?.replace(/\D/g, '') || '';

        try {
            // Step 1: Always do a fresh search to find existing lead
            let existingId = leadId;

            if (!existingId && phone) {
                const searchRes = await fetch(`${API_BASE_URL}/leads?phone=${encodeURIComponent(phone)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (searchRes.ok) {
                    const found = await searchRes.json();
                    const leads = Array.isArray(found) ? found : [];
                    if (leads.length > 0) {
                        existingId = leads[0].id;
                        setLeadId(leads[0].id);
                    }
                }
            }

            if (existingId) {
                // Step 2a: Update existing lead
                const upRes = await fetch(`${API_BASE_URL}/leads/${existingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ status: newStage }),
                });
                if (!upRes.ok) throw new Error(`Update failed: ${upRes.status}`);
            } else {
                // Step 2b: Create new lead
                const createRes = await fetch(`${API_BASE_URL}/leads`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        name: chat?.name || chat?.phoneNumber,
                        phone,
                        status: newStage,
                        source: 'whatsapp',
                        assignedTo: userId,
                        ownerId: userId,
                    }),
                });
                const created = await createRes.json();
                if (!createRes.ok) throw new Error(`Create failed: ${createRes.status} - ${JSON.stringify(created)}`);
                if (created?.id) setLeadId(created.id);
            }

            setStageSaved(true);
            setTimeout(() => setStageSaved(false), 3000);

        } catch (err) {
            console.error('[CRMPanel] saveStage error:', err);
            // Show error visually
            setStageSaved(false);
        } finally {
            setStageSaving(false);
        }
    };

    const saveNotes = async () => {
        if (!leadId) return;
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/leads/${leadId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ notes }),
        }).catch(() => {});
    };

    if (!chat) return null;

    const phone = chat.phoneNumber?.replace(/\D/g, '');
    const phoneFormatted = phone ? `+${phone}` : '';

    return (
        <div className={`relative flex shrink-0 h-full transition-all duration-300 ${isVisible ? 'w-[300px]' : 'w-0'}`}>
            {/* Toggle tab on left edge */}
            <button
                onClick={onClose}
                title={isVisible ? 'Recolher painel' : 'Expandir painel'}
                className="absolute -left-5 top-1/2 -translate-y-1/2 z-30 w-5 h-14 bg-white border border-gray-200 rounded-l-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm"
            >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isVisible ? 'rotate-0' : 'rotate-180'}`} />
            </button>

            {isVisible && (
                <div className="w-[300px] shrink-0 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto custom-scrollbar z-20">
                    {showSchedule && <ScheduleModal chat={chat} onClose={() => setShowSchedule(false)} />}

                    {/* Header */}
                    <div className="bg-white p-5 flex flex-col items-center border-b border-gray-100 shadow-sm">
                        <img
                            src={chat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || chat.phoneNumber)}&background=6366f1&color=fff`}
                            className="w-20 h-20 rounded-full object-cover mb-3 border-4 border-indigo-50"
                            alt=""
                        />
                        <h3 className="text-lg font-bold text-gray-800 text-center">{chat.name || chat.phoneNumber}</h3>
                        <p className="text-gray-400 text-xs mb-4">{phoneFormatted}</p>

                        <div className="flex gap-3 w-full">
                            <a
                                href={`tel:${phoneFormatted}`}
                                className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-bold hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors flex flex-col items-center gap-1"
                            >
                                <PhoneCall className="w-4 h-4" /> Ligar
                            </a>
                            <button
                                onClick={() => setShowSchedule(true)}
                                className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-bold hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors flex flex-col items-center gap-1"
                            >
                                <Calendar className="w-4 h-4" /> Agendar
                            </button>
                            {leadId && (
                                <a
                                    href={`/admin/crm`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-bold hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors flex flex-col items-center gap-1"
                                >
                                    <ExternalLink className="w-4 h-4" /> CRM
                                </a>
                            )}
                        </div>
                    </div>

                    {/* CRM Info */}
                    <div className="p-4 space-y-4 bg-[#f7f8fa] flex-1">

                        {/* Funnel Stage — dropdown */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100" ref={dropdownRef}>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                                Etapa do Funil
                                <span className="flex items-center gap-1">
                                    {stageSaving && <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />}
                                    {stageSaved && <Check className="w-3 h-3 text-green-500" />}
                                </span>
                            </h4>

                            {/* Selected stage button */}
                            <button
                                onClick={() => setShowStageDropdown(v => !v)}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-200 hover:border-indigo-400 transition-colors text-sm font-medium text-gray-700 bg-gray-50"
                            >
                                <span className="flex items-center gap-2">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: PIPELINE_STAGES.find(s => s.id === stage)?.color || '#6366f1' }}
                                    />
                                    {PIPELINE_STAGES.find(s => s.id === stage)?.label || stage}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showStageDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown list */}
                            {showStageDropdown && (
                                <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden shadow-lg z-50 bg-white">
                                    {PIPELINE_STAGES.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => saveStage(s.id)}
                                            className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                                                stage === s.id
                                                    ? 'bg-indigo-600 text-white font-semibold'
                                                    : 'hover:bg-indigo-50 text-gray-700'
                                            }`}
                                        >
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: stage === s.id ? '#fff' : s.color }}
                                            />
                                            {s.label}
                                            {stage === s.id && <Check className="w-3.5 h-3.5 ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Deal Value */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                                Valor do Negócio <DollarSign className="w-3.5 h-3.5" />
                            </h4>
                            <div className="flex items-center bg-green-50 rounded-lg border border-green-200 px-3 py-2">
                                <span className="text-green-700 font-bold mr-2 text-sm">R$</span>
                                <input
                                    type="text"
                                    className="bg-transparent font-bold text-green-800 outline-none w-full text-sm"
                                    value={dealValue}
                                    onChange={e => setDealValue(e.target.value)}
                                    onBlur={() => {
                                        if (!leadId) return;
                                        const token = localStorage.getItem('token');
                                        const val = parseFloat(dealValue.replace(',', '.')) || 0;
                                        fetch(`${API_BASE_URL}/leads/${leadId}`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                            body: JSON.stringify({ value: val }),
                                        }).catch(() => {});
                                    }}
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <StickyNote className="w-3.5 h-3.5" /> Anotações
                            </h4>
                            <textarea
                                className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-gray-700 resize-none outline-none focus:ring-2 focus:ring-yellow-400 placeholder-yellow-500/60"
                                rows={4}
                                placeholder="Escreva uma nota sobre este contato..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                onBlur={saveNotes}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
