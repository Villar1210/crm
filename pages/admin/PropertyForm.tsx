
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Upload, Sparkles, MapPin, Home, DollarSign, Image as ImageIcon, X, Key, Building } from 'lucide-react';
import { api } from '../../services/api';
import { Property, PropertyType } from '../../types';
import { upsertRealEstateProperty } from './realEstate/mockData';

const PropertyForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Property>>({
    title: '',
    type: PropertyType.APARTMENT,
    businessType: 'SALE', // Default
    price: 0,
    rentPrice: 0,
    condoPrice: 0,
    iptuPrice: 0,
    area: 0,
    bedrooms: 0,
    bathrooms: 0,
    suites: 0,
    address: '',
    city: '',
    state: 'SP',
    description: '',
    features: [],
    images: [],
    status: 'active',
    featured: false,
    published: true,
    realEstateLinked: false,
    realEstateLinkId: ''
  });

  const [featureInput, setFeatureInput] = useState('');
  // TODO: integrate scopeType with backend payload when available.
  const [scopeType, setScopeType] = useState<'unidade' | 'empreendimento'>('unidade');
  // TODO: integrar com API.
  const [developmentType, setDevelopmentType] = useState<string | null>(null);
  const [towerCount, setTowerCount] = useState<number>(1);
  const [createLandingPage, setCreateLandingPage] = useState(false);
  // TODO: integrar esses campos com o backend.
  const [floorsPerBlock, setFloorsPerBlock] = useState<number | null>(null);
  const [unitsPerFloor, setUnitsPerFloor] = useState<number | null>(null);
  const [defaultUnitType, setDefaultUnitType] = useState<string>('');

  // Fetch data if editing
  useEffect(() => {
    if (id) {
      const fetchProp = async () => {
        const data = await api.properties.getById(id);
        if (data) setFormData(data);
      }
      fetchProp();
    }
  }, [id]);

  // Simulate AI Description Generation
  const generateDescription = async () => {
    setAiLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    let typeText = formData.businessType === 'SALE' ? 'venda' : formData.businessType === 'RENT' ? 'locação' : 'venda e locação';

    const aiText = `Oportunidade única para ${typeText}! Este incrível ${formData.type?.toLowerCase()} localizado em ${formData.city} oferece o equilíbrio perfeito entre conforto e sofisticação. Com ${formData.area}m² de área útil, dispõe de ${formData.bedrooms} dormitórios (sendo ${formData.suites} suítes) e acabamento de alto padrão. \n\nA localização privilegiada na ${formData.address} garante fácil acesso às principais vias da cidade. O condomínio oferece infraestrutura completa. Agende sua visita!`;

    setFormData(prev => ({ ...prev, description: aiText }));
    setAiLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const propertyId = isEditing ? id! : `prop-${Date.now()}`;
    const realEstateLinkId =
      (typeof formData.realEstateLinkId === 'string' && formData.realEstateLinkId.trim()) ||
      (formData.realEstateLinked ? `re-site-${propertyId}` : undefined);

    const payload: Property = {
      id: propertyId,
      title: formData.title || 'Imovel sem titulo',
      description: formData.description || '',
      businessType: formData.businessType ?? 'SALE',
      price: formData.price ?? 0,
      rentPrice: formData.rentPrice ?? 0,
      condoPrice: formData.condoPrice ?? 0,
      iptuPrice: formData.iptuPrice ?? 0,
      type: formData.type ?? PropertyType.APARTMENT,
      bedrooms: formData.bedrooms ?? 0,
      bathrooms: formData.bathrooms ?? 0,
      suites: formData.suites ?? 0,
      area: formData.area ?? 0,
      address: formData.address ?? '',
      city: formData.city ?? '',
      state: formData.state ?? 'SP',
      images: formData.images ?? [],
      featured: formData.featured ?? false,
      published: formData.published ?? true,
      realEstateLinked: formData.realEstateLinked ?? false,
      realEstateLinkId,
      status: formData.status ?? 'active',
      features: formData.features ?? [],
      launchDetails: formData.launchDetails,
      campaignIds: formData.campaignIds
    };

    if (isEditing) {
      await api.properties.update(propertyId, payload);
    } else {
      await api.properties.create(payload);
    }

    if (payload.realEstateLinked) {
      const purpose =
        payload.businessType === 'SALE'
          ? 'venda'
          : payload.businessType === 'RENT'
            ? 'locacao'
            : 'ambos';
      const rentValue =
        payload.businessType === 'SALE' ? payload.price : payload.rentPrice ?? payload.price;
      const statusMap =
        payload.status === 'rented' ? 'ocupado' : payload.status === 'sold' ? 'reservado' : 'vago';
      const realEstateAddress = [payload.address, payload.city, payload.state].filter(Boolean).join(' - ');

      upsertRealEstateProperty({
        id: realEstateLinkId ?? `re-site-${propertyId}`,
        sitePropertyId: propertyId,
        title: payload.title,
        address: realEstateAddress,
        type: payload.type,
        owner: 'Nao informado',
        status: statusMap,
        purpose,
        rent: rentValue ?? 0,
        financeStatus: 'em dia'
      });
      // TODO: integrar com backend para vincular o cadastro de imoveis entre modulos.
    }

    setLoading(false);
    navigate('/admin/properties');
  };

  const addFeature = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && featureInput) {
      e.preventDefault();
      setFormData(prev => ({ ...prev, features: [...(prev.features || []), featureInput] }));
      setFeatureInput('');
    }
  };

  const removeFeature = (idx: number) => {
    setFormData(prev => ({ ...prev, features: prev.features?.filter((_, i) => i !== idx) }));
  };

  // Helper to calculate total monthly package
  const totalPackage = (formData.rentPrice || 0) + (formData.condoPrice || 0) + (formData.iptuPrice || 0);
  const unidadesPorBloco = (floorsPerBlock || 0) * (unitsPerFloor || 0);
  const totalUnidadesEmpreendimento = (towerCount || 0) * unidadesPorBloco;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/properties')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-serif font-bold text-gray-900">{isEditing ? 'Editar Imóvel' : 'Novo Imóvel'}</h2>
            <p className="text-gray-500 text-sm">Preencha os dados abaixo para publicar no site.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/admin/properties')} className="px-6 py-2 border border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 flex items-center gap-2">
            {loading ? 'Salvando...' : <><Save size={18} /> Publicar Imóvel</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Info Card */}
          <section className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><Home size={20} className="text-brand-600" /> Informações Principais</h3>

            <div className="space-y-6">
              {/* Objective Toggle */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Finalidade do Anúncio</label>
                <div className="flex gap-4">
                  <label className={`flex-1 cursor-pointer border-2 rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${formData.businessType === 'SALE' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="businessType" className="hidden" checked={formData.businessType === 'SALE'} onChange={() => setFormData({ ...formData, businessType: 'SALE' })} />
                    <Home size={18} /> Venda
                  </label>
                  <label className={`flex-1 cursor-pointer border-2 rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${formData.businessType === 'RENT' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="businessType" className="hidden" checked={formData.businessType === 'RENT'} onChange={() => setFormData({ ...formData, businessType: 'RENT' })} />
                    <Key size={18} /> Locação
                  </label>
                  <label className={`flex-1 cursor-pointer border-2 rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${formData.businessType === 'BOTH' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="businessType" className="hidden" checked={formData.businessType === 'BOTH'} onChange={() => setFormData({ ...formData, businessType: 'BOTH' })} />
                    <Sparkles size={18} /> Ambos
                  </label>
                </div>
              </div>

              {/* === Escopo do imóvel (Unidade x Empreendimento) === */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Tipo do anúncio / Escopo do imóvel</label>
                <div className="inline-flex gap-2">
                  <label className={`cursor-pointer border rounded-xl px-4 py-2 flex items-center justify-center gap-2 transition-all ${scopeType === 'unidade' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="scopeType"
                      className="hidden"
                      checked={scopeType === 'unidade'}
                      onChange={() => setScopeType('unidade')}
                    />
                    <Home size={18} /> Unidade
                  </label>
                  <label className={`cursor-pointer border rounded-xl px-4 py-2 flex items-center justify-center gap-2 transition-all ${scopeType === 'empreendimento' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="scopeType"
                      className="hidden"
                      checked={scopeType === 'empreendimento'}
                      onChange={() => setScopeType('empreendimento')}
                    />
                    <Building size={18} /> Empreendimento
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Título do Anúncio</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="Ex: Apartamento de Luxo no Jardins"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Imóvel</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as PropertyType })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  >
                    {Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Área Útil (m²)</label>
                  <input type="number" value={formData.area} onChange={e => setFormData({ ...formData, area: Number(e.target.value) })} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quartos</label>
                  <input type="number" value={formData.bedrooms} onChange={e => setFormData({ ...formData, bedrooms: Number(e.target.value) })} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banheiros</label>
                  <input type="number" value={formData.bathrooms} onChange={e => setFormData({ ...formData, bathrooms: Number(e.target.value) })} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Suítes</label>
                  <input type="number" value={formData.suites} onChange={e => setFormData({ ...formData, suites: Number(e.target.value) })} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none" />
                </div>
              </div>

              {scopeType === 'empreendimento' && (
                // === Configuração do Empreendimento (blocos/andares/unidades) ===
                <section className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5 mt-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-8 w-8 flex items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <Building size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Configuração do Empreendimento</h4>
                      <p className="text-xs text-slate-500">Defina blocos e o padrão de andares/unidades do empreendimento.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Tipo de empreendimento</label>
                      <select
                        value={developmentType ?? ''}
                        onChange={e => setDevelopmentType(e.target.value || null)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      >
                        <option value="">Selecione...</option>
                        <option value="condominio_residencial">Condomínio residencial</option>
                        <option value="condominio_comercial">Condomínio comercial</option>
                        <option value="torre_unica">Bloco único</option>
                        <option value="misto">Misto (residencial/comercial)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Quantidade de blocos</label>
                      <input
                        type="number"
                        min={1}
                        value={towerCount}
                        onChange={e => setTowerCount(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none"
                      />
                      <p className="text-[0.6875rem] text-slate-400 mt-1">Use 1 para bloco único.</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Número de andares por bloco</label>
                      <input
                        type="number"
                        min={1}
                        value={floorsPerBlock ?? ''}
                        onChange={e => setFloorsPerBlock(e.target.value === '' ? null : Number(e.target.value))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Unidades por andar</label>
                      <input
                        type="number"
                        min={1}
                        value={unitsPerFloor ?? ''}
                        onChange={e => setUnitsPerFloor(e.target.value === '' ? null : Number(e.target.value))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Tipo de unidade padrão (opcional)</label>
                    <input
                      type="text"
                      value={defaultUnitType}
                      onChange={e => setDefaultUnitType(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none"
                      placeholder="Ex: 2 dorm"
                    />
                  </div>

                  {unidadesPorBloco > 0 && (
                    <p className="mt-3 text-[0.6875rem] text-slate-500">
                      Unidades por bloco: <span className="text-xs font-semibold text-slate-900">{unidadesPorBloco}</span> unidades
                    </p>
                  )}

                  {totalUnidadesEmpreendimento > 0 && (
                    <p className="text-[0.6875rem] text-slate-500">
                      Total de unidades do empreendimento:{' '}
                      <span className="text-xs font-semibold text-slate-900">{totalUnidadesEmpreendimento}</span> unidade(s)
                    </p>
                  )}
                </section>
              )}
            </div>
          </section>

          {/* Financial Details */}
          <section className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><DollarSign size={20} className="text-brand-600" /> Valores & Encargos</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {(formData.businessType === 'SALE' || formData.businessType === 'BOTH') && (
                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                  <label className="block text-sm font-bold text-green-800 mb-2">Valor de Venda (R$)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white font-bold text-green-900"
                  />
                </div>
              )}
              {(formData.businessType === 'RENT' || formData.businessType === 'BOTH') && (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <label className="block text-sm font-bold text-blue-800 mb-2">Valor do Aluguel (R$)</label>
                  <input
                    type="number"
                    value={formData.rentPrice}
                    onChange={e => setFormData({ ...formData, rentPrice: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-blue-900"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condomínio (Mensal)</label>
                <input
                  type="number"
                  value={formData.condoPrice}
                  onChange={e => setFormData({ ...formData, condoPrice: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IPTU (Mensal)</label>
                <input
                  type="number"
                  value={formData.iptuPrice}
                  onChange={e => setFormData({ ...formData, iptuPrice: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none"
                />
              </div>
            </div>

            {(formData.businessType === 'RENT' || formData.businessType === 'BOTH') && (
              <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Estimativa Pacote Mensal (Aluguel + Cond. + IPTU):</span>
                <span className="text-xl font-bold text-gray-900">{totalPackage.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            )}
          </section>

          {/* Description with AI */}
          <section className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Descrição Detalhada</h3>
              <button
                onClick={generateDescription}
                disabled={aiLoading}
                className="flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-1.5 rounded-full hover:shadow-lg transition-all transform hover:scale-105"
              >
                {aiLoading ? 'Gerando...' : <><Sparkles size={14} /> Gerar com IA</>}
              </button>
            </div>
            <textarea
              rows={6}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              placeholder="Descreva os detalhes do imóvel..."
            ></textarea>
          </section>

          {/* Images */}
          <section className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><ImageIcon size={20} className="text-brand-600" /> Mídia & Imagens</h3>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload size={32} />
              </div>
              <p className="text-gray-900 font-bold">Clique para fazer upload</p>
              <p className="text-gray-500 text-sm">ou arraste seus arquivos aqui (JPG, PNG)</p>
            </div>

            {/* Mock Gallery Preview */}
            {formData.images && formData.images.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mt-6">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Location */}
          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin size={20} className="text-brand-600" /> Localização</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none" placeholder="00000-000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                  <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <input type="text" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none" />
                </div>
              </div>
            </div>
          </section>

          {/* Features Tags */}
          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Comodidades</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.features?.map((feat, idx) => (
                <span key={idx} className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  {feat} <button onClick={() => removeFeature(idx)}><X size={12} /></button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={featureInput}
              onChange={e => setFeatureInput(e.target.value)}
              onKeyDown={addFeature}
              placeholder="Digite e aperte Enter..."
              className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none text-sm"
            />
          </section>

          {/* Visibility */}
          <section className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Visibilidade</h3>
            <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-slate-100 transition mb-3 cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500"
                />
                <span className="font-medium text-gray-700">Destaque na Home</span>
              </div>
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-slate-100 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.published !== false}
                  onChange={e => setFormData({ ...formData, published: e.target.checked })}
                  className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500"
                />
                <span className="font-medium text-gray-700">Imovel Ativo no Site</span>
              </div>
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-slate-100 transition cursor-pointer mt-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500"
                  checked={formData.realEstateLinked ?? false}
                  onChange={(e) => setFormData({ ...formData, realEstateLinked: e.target.checked })}
                />
                <span className="font-medium text-gray-700">Gestao Imobiliaria</span>
              </div>
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-slate-100 transition cursor-pointer mt-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500"
                  checked={createLandingPage}
                  onChange={(e) => setCreateLandingPage(e.target.checked)}
                />
                <span className="font-medium text-gray-700">Criar Landing Page</span>
              </div>
            </label>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PropertyForm;


