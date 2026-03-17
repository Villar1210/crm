import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, FileText, Trash2, Copy, Edit,
    Calendar, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';

const EmailCampaignsList: React.FC = () => {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const data = await api.email.getCampaigns();
            setCampaigns(data);
        } catch (error) {
            console.error('Erro ao buscar campanhas:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter campaigns
    const filteredCampaigns = campaigns.filter(campaign => {
        const matchesSearch = campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            campaign.subject?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'sent': return 'bg-green-100 text-green-700';
            case 'draft': return 'bg-gray-100 text-gray-700';
            case 'sending': return 'bg-blue-100 text-blue-700';
            case 'scheduled': return 'bg-purple-100 text-purple-700';
            case 'paused': return 'bg-amber-100 text-amber-700';
            case 'failed': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'sent': return 'Enviada';
            case 'draft': return 'Rascunho';
            case 'sending': return 'Enviando';
            case 'scheduled': return 'Agendada';
            case 'paused': return 'Pausada';
            case 'failed': return 'Erro';
            default: return status;
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;
        try {
            await api.email.deleteCampaign(id);
            // Refresh list
            fetchCampaigns();
        } catch (error) {
            console.error('Erro ao excluir campanha:', error);
            alert('Erro ao excluir campanha');
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            await api.email.duplicateCampaign(id);
            fetchCampaigns();
        } catch (error) {
            console.error('Erro ao duplicar campanha:', error);
            alert('Erro ao duplicar campanha');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900">Minhas Campanhas</h2>
                    <p className="text-gray-500 text-sm">Gerencie seus disparos de email e automações</p>
                </div>
                <button
                    onClick={() => navigate('/admin/email-marketing/campaigns/new')}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2 font-medium shadow-sm w-full md:w-auto justify-center"
                >
                    <Plus className="w-5 h-5" />
                    Nova Campanha
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou assunto..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <select
                        className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 text-sm w-full md:w-auto"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todos os Status</option>
                        <option value="draft">Rascunhos</option>
                        <option value="scheduled">Agendadas</option>
                        <option value="sending">Enviando</option>
                        <option value="sent">Enviadas</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase font-semibold tracking-wider">
                                <th className="p-4">Campanha</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Destinatários</th>
                                <th className="p-4 text-center">Abertura</th>
                                <th className="p-4 text-center">Cliques</th>
                                <th className="p-4 text-center">Data</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Carregando campanhas...
                                    </td>
                                </tr>
                            )}

                            {!loading && filteredCampaigns.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium">Nenhuma campanha encontrada</p>
                                            <p className="text-sm">Tente ajustar seus filtros ou crie uma nova campanha.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading && filteredCampaigns.map((campaign) => (
                                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4">
                                        <div>
                                            <p className="font-semibold text-gray-900">{campaign.name}</p>
                                            <p className="text-sm text-gray-500 truncate max-w-xs">{campaign.subject}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                                            {getStatusLabel(campaign.status)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center text-gray-700">
                                        {campaign.recipientCount?.toLocaleString() || 0}
                                    </td>
                                    <td className="p-4 text-center">
                                        {(campaign.status === 'sent' || campaign.status === 'sending') ? (
                                            <span className="font-medium text-gray-900">{campaign.openRate || 0}%</span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {(campaign.status === 'sent' || campaign.status === 'sending') ? (
                                            <span className="font-medium text-gray-900">{campaign.clickRate || 0}%</span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center text-sm text-gray-500">
                                        {campaign.status === 'scheduled' ? (
                                            <div className="flex flex-col items-center">
                                                <Calendar className="w-4 h-4 mb-1" />
                                                <span>{new Date(campaign.scheduledAt!).toLocaleDateString()}</span>
                                            </div>
                                        ) : (
                                            <span>{campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : 'Não enviado'}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {campaign.status === 'draft' && (
                                                <button
                                                    title="Editar"
                                                    className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                                                    onClick={() => navigate(`/admin/email-marketing/campaigns/${campaign.id}/edit`)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            )}

                                            <button
                                                title="Duplicar"
                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                onClick={() => handleDuplicate(campaign.id)}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>

                                            {(campaign.status === 'sent' || campaign.status === 'sending') && (
                                                <button
                                                    title="Relatório"
                                                    className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                                                    onClick={() => navigate(`/admin/email-marketing/campaigns/${campaign.id}/report`)}
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            )}

                                            <button
                                                title="Excluir"
                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                onClick={() => handleDelete(campaign.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmailCampaignsList;
