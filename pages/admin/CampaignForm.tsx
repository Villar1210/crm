import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Image as ImageIcon, Calendar, Tag } from 'lucide-react';
import { api } from '../../services/api';
import { Property } from '../../types';

const CampaignForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [properties, setProperties] = useState<Property[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        discountPercentage: '',
        startDate: '',
        endDate: '',
        active: true,
        image: '',
        propertyIds: [] as string[]
    });

    useEffect(() => {
        fetchProperties();
        if (isEditing) {
            fetchCampaign();
        }
    }, [id]);

    const fetchProperties = async () => {
        try {
            const data = await api.properties.getAll();
            setProperties(data);
        } catch (error) {
            console.error('Error fetching properties', error);
        }
    };

    const fetchCampaign = async () => {
        try {
            const data = await api.campaigns.getById(id!);
            setFormData({
                title: data.title,
                description: data.description || '',
                discountPercentage: data.discountPercentage?.toString() || '',
                startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
                endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
                active: data.active,
                image: data.image || '',
                propertyIds: data.properties?.map(p => p.id) || []
            });
        } catch (error) {
            console.error('Error fetching campaign', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                discountPercentage: Number(formData.discountPercentage),
                propertyIds: formData.propertyIds
            };

            if (isEditing) {
                await api.campaigns.update(id!, payload);
            } else {
                await api.campaigns.create(payload);
            }
            navigate('/admin/campaigns');
        } catch (error) {
            console.error('Error saving campaign', error);
            alert('Erro ao salvar campanha');
        } finally {
            setLoading(false);
        }
    };

    const toggleProperty = (propertyId: string) => {
        setFormData(prev => {
            const exists = prev.propertyIds.includes(propertyId);
            return {
                ...prev,
                propertyIds: exists
                    ? prev.propertyIds.filter(pid => pid !== propertyId)
                    : [...prev.propertyIds, propertyId]
            };
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/campaigns')} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-serif font-bold text-gray-900">
                        {isEditing ? 'Editar Campanha' : 'Nova Campanha'}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-brand-600" />
                        Informações Básicas
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título da Campanha</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder="Ex: Black Friday, Queima de Estoque"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                rows={3}
                                placeholder="Detalhes da promoção..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    value={formData.discountPercentage}
                                    onChange={e => setFormData({ ...formData, discountPercentage: e.target.value })}
                                    className="w-full pl-4 pr-8 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={formData.active ? 'active' : 'inactive'}
                                onChange={e => setFormData({ ...formData, active: e.target.value === 'active' })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="active">Ativa</option>
                                <option value="inactive">Pausada</option>
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem Banner</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="url"
                                        value={formData.image}
                                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            {formData.image && (
                                <img src={formData.image} alt="Preview" className="mt-2 h-32 rounded-lg object-cover border border-gray-200" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-brand-600" />
                        Vigência
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                            <input
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Término</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Deixe em branco para prazo indeterminado</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Selecionar Imóveis ({formData.propertyIds.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
                        {properties.map(property => (
                            <label key={property.id} className={`
                relative flex items-start gap-3 p-3 rounded-xl border border-2 cursor-pointer transition-all
                ${formData.propertyIds.includes(property.id)
                                    ? 'border-brand-500 bg-brand-50'
                                    : 'border-gray-100 hover:border-brand-200'}
              `}>
                                <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={formData.propertyIds.includes(property.id)}
                                    onChange={() => toggleProperty(property.id)}
                                />
                                <div>
                                    <div className="font-medium text-gray-900 line-clamp-1">{property.title}</div>
                                    <div className="text-sm text-gray-500">{property.type}</div>
                                    <div className="text-xs text-brand-600 font-bold mt-1">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price)}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/campaigns')}
                        className="px-6 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20 flex items-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        {loading ? 'Salvando...' : 'Salvar Campanha'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CampaignForm;
