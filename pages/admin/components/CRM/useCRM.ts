import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../../services/api';
import { Lead, LeadStatus, Pipeline, CRMSettings } from '../../../../types';
import { DEFAULT_PIPELINE } from '../../../../constants';

export const useCRM = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [pipelines, setPipelines] = useState<Pipeline[]>([DEFAULT_PIPELINE]);
    const [currentPipelineId, setCurrentPipelineId] = useState<string>(DEFAULT_PIPELINE.id);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeView, setActiveView] = useState<'kanban' | 'list' | 'broadcast' | 'roulette' | 'automations'>('kanban');
    const [showAddLead, setShowAddLead] = useState(false);
    const [crmSettings, setCrmSettings] = useState<CRMSettings>({
        allowDefaultPipelineDeletion: false,
        enableProfileMaster: true,
        enableProfileWA: false,
        enableProfileSF: false,
        enableProfilePD: false,
        enableProfileRD: false,
        defaultProfile: 'MASTER',
        whatsappIntegrationMode: 'platform',
        enableAutomations: false,
        automationStagnancyDays: 3
    });

    // Filtros
    const [filterSource, setFilterSource] = useState('');
    const [filterTemperature, setFilterTemperature] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [filterValueMin, setFilterValueMin] = useState('');
    const [filterValueMax, setFilterValueMax] = useState('');

    // Loss modal
    const [lossLeadId, setLossLeadId] = useState<string | null>(null);
    const [showLossModal, setShowLossModal] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [leadsData, pipelinesData, settings] = await Promise.all([
                api.leads.getAll({ limit: 200 }),
                api.pipelines.getAll(),
                api.crm.getSettings()
            ]);
            setLeads(leadsData?.leads || []);
            if (pipelinesData?.pipelines?.length) {
                setPipelines(pipelinesData.pipelines);
            }
            if (settings) setCrmSettings(settings);
        } catch (e) {
            console.error('CRM load error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const currentPipeline = pipelines.find(p => p.id === currentPipelineId) || pipelines[0];

    const getVisibleLeads = useCallback(() => {
        let filtered = [...leads];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(l =>
                l.name?.toLowerCase().includes(q) ||
                l.phone?.includes(q) ||
                l.email?.toLowerCase().includes(q)
            );
        }
        if (filterSource) filtered = filtered.filter(l => l.source === filterSource);
        if (filterTemperature) filtered = filtered.filter(l => l.temperature === filterTemperature);
        if (filterDateStart) filtered = filtered.filter(l => new Date(l.createdAt) >= new Date(filterDateStart));
        if (filterDateEnd) filtered = filtered.filter(l => new Date(l.createdAt) <= new Date(filterDateEnd));
        if (filterValueMin) filtered = filtered.filter(l => (l.value || 0) >= parseFloat(filterValueMin));
        if (filterValueMax) filtered = filtered.filter(l => (l.value || 0) <= parseFloat(filterValueMax));
        return filtered;
    }, [leads, searchQuery, filterSource, filterTemperature, filterDateStart, filterDateEnd, filterValueMin, filterValueMax]);

    const handleDropLead = useCallback(async (newStatus: string) => {
        if (!draggedLeadId) return;
        const lead = leads.find(l => l.id === draggedLeadId);
        if (!lead || lead.status === newStatus) { setDraggedLeadId(null); return; }

        if (newStatus === LeadStatus.LOST) {
            setLossLeadId(draggedLeadId);
            setShowLossModal(true);
            setDraggedLeadId(null);
            return;
        }

        setLeads(prev => prev.map(l => l.id === draggedLeadId ? { ...l, status: newStatus as LeadStatus } : l));
        setDraggedLeadId(null);
        try {
            await api.leads.updateStatus(draggedLeadId, newStatus as LeadStatus);
        } catch (e) {
            console.error('Failed to update lead status:', e);
            loadData();
        }
    }, [draggedLeadId, leads, loadData]);

    const handleLeadUpdate = useCallback((updatedLead: Lead) => {
        setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
        setSelectedLead(updatedLead);
    }, []);

    const resetFilters = () => {
        setFilterSource('');
        setFilterTemperature('');
        setFilterDateStart('');
        setFilterDateEnd('');
        setFilterValueMin('');
        setFilterValueMax('');
    };

    const moveColumn = (dragIndex: number, hoverIndex: number) => {
        const newPipelines = [...pipelines];
        const pipeIndex = newPipelines.findIndex(p => p.id === currentPipelineId);
        if (pipeIndex === -1) return;
        const newStages = [...newPipelines[pipeIndex].stages];
        const [removed] = newStages.splice(dragIndex, 1);
        newStages.splice(hoverIndex, 0, removed);
        newPipelines[pipeIndex] = { ...newPipelines[pipeIndex], stages: newStages };
        setPipelines(newPipelines);
    };

    const saveOrder = async () => {
        try {
            await api.pipelines.save(pipelines);
        } catch (e) {
            console.error('Failed to save pipeline order:', e);
        }
    };

    return {
        leads, setLeads, loading, loadData,
        pipelines, setPipelines, currentPipelineId, setCurrentPipelineId, currentPipeline,
        selectedLead, setSelectedLead, isFullScreen, setIsFullScreen,
        draggedLeadId, setDraggedLeadId,
        searchQuery, setSearchQuery,
        activeView, setActiveView,
        showAddLead, setShowAddLead,
        crmSettings, setCrmSettings,
        filterSource, setFilterSource,
        filterTemperature, setFilterTemperature,
        filterDateStart, setFilterDateStart,
        filterDateEnd, setFilterDateEnd,
        filterValueMin, setFilterValueMin,
        filterValueMax, setFilterValueMax,
        lossLeadId, setLossLeadId,
        showLossModal, setShowLossModal,
        getVisibleLeads,
        handleDropLead,
        handleLeadUpdate,
        resetFilters,
        moveColumn,
        saveOrder
    };
};
