import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Eye,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  MousePointer,
  Music2,
  Repeat,
  Search,
  Target,
  Users,
  X,
  Zap
} from 'lucide-react';
import { MOCK_PROPERTIES } from '../../constants';
import SocialManager from './marketing/social/SocialManager';
import { AdCampaign, AdObjective, AdPlatform, AdsDashboardStats } from '../../types';
import {
  fetchAdsDashboardStats,
  fetchAdCampaigns,
  createAdCampaign
} from '../../services/api';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value
  );

const formatCompact = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);

const platformOptions: {
  id: AdPlatform;
  label: string;
  icon: React.ElementType;
  pill: string;
}[] = [
    {
      id: 'meta',
      label: 'Meta Ads',
      icon: Facebook,
      pill: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    {
      id: 'google',
      label: 'Google Ads',
      icon: Globe,
      pill: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 'linkedin',
      label: 'LinkedIn Ads',
      icon: Linkedin,
      pill: 'bg-sky-50 text-sky-700 border-sky-200'
    },
    {
      id: 'tiktok',
      label: 'TikTok Ads',
      icon: Music2,
      pill: 'bg-slate-100 text-slate-700 border-slate-200'
    }
  ];

const objectiveOptions: {
  id: AdObjective;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
    {
      id: 'reach',
      label: 'Alcance',
      description: 'Exibir para o maior numero de pessoas unicas.',
      icon: Users
    },
    {
      id: 'traffic',
      label: 'Trafego',
      description: 'Foco em cliques para site ou landing page.',
      icon: MousePointer
    },
    {
      id: 'leads',
      label: 'Leads',
      description: 'Prioriza conversoes e cadastro de interessados.',
      icon: Target
    },
    {
      id: 'messages',
      label: 'Mensagens / WhatsApp',
      description: 'Estimula conversas diretas com o time comercial.',
      icon: MessageCircle
    }
  ];

const stepLabels = ['Imovel', 'Canais', 'Objetivo', 'Publico', 'Orcamento'];

const Marketing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'social' | 'ads'>('social');

  const [adsStats, setAdsStats] = useState<AdsDashboardStats | null>(null);
  const [adsCampaigns, setAdsCampaigns] = useState<AdCampaign[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState<string | null>(null);

  const [showAdWizard, setShowAdWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardMode, setWizardMode] = useState<'create' | 'boost'>('create');
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [wizardSubmitting, setWizardSubmitting] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);

  const [campaignName, setCampaignName] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<AdPlatform[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<AdObjective | null>(null);

  const [audienceLocation, setAudienceLocation] = useState('');
  const [audienceRadius, setAudienceRadius] = useState(5);
  const [audienceAgeMin, setAudienceAgeMin] = useState(25);
  const [audienceAgeMax, setAudienceAgeMax] = useState(55);
  const [audienceInterests, setAudienceInterests] = useState('');

  const [dailyBudget, setDailyBudget] = useState(60);
  const [durationDays, setDurationDays] = useState(15);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState('');

  const SocialMediaTab = () => <SocialManager />;
  const propertyMap = useMemo(() => {
    return new Map(MOCK_PROPERTIES.map(property => [property.id, property]));
  }, []);

  const filteredProperties = useMemo(() => {
    const query = propertySearch.trim().toLowerCase();
    if (!query) {
      return MOCK_PROPERTIES;
    }
    return MOCK_PROPERTIES.filter(property =>
      [property.title, property.city, property.state]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(query))
    );
  }, [propertySearch]);

  const computedDuration = useMemo(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diff = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
      return diff > 0 ? diff : durationDays;
    }
    return durationDays;
  }, [startDate, endDate, durationDays]);

  const totalBudget = Math.max(0, dailyBudget) * Math.max(1, computedDuration);

  const loadAdsData = async () => {
    setAdsLoading(true);
    setAdsError(null);
    try {
      const [stats, campaigns] = await Promise.all([
        fetchAdsDashboardStats(),
        fetchAdCampaigns()
      ]);
      setAdsStats(stats);
      setAdsCampaigns(campaigns);
    } catch (error) {
      setAdsError('Nao foi possivel carregar os anuncios.');
    } finally {
      setAdsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'ads') return;
    loadAdsData();
  }, [activeTab]);

  const resetWizard = () => {
    setWizardStep(1);
    setWizardError(null);
    setCampaignName('');
    setPropertySearch('');
    setSelectedPropertyId('');
    setSelectedPlatforms([]);
    setSelectedObjective(null);
    setAudienceLocation('');
    setAudienceRadius(5);
    setAudienceAgeMin(25);
    setAudienceAgeMax(55);
    setAudienceInterests('');
    setDailyBudget(60);
    setDurationDays(15);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate('');
  };

  const openCreateWizard = () => {
    setWizardMode('create');
    resetWizard();
    setShowAdWizard(true);
  };

  const openBoostWizard = (campaign: AdCampaign) => {
    setWizardMode('boost');
    setWizardError(null);
    setCampaignName(campaign.name);
    setSelectedPropertyId(campaign.propertyId ?? '');
    setSelectedPlatforms([campaign.platform]);
    setSelectedObjective(campaign.objective);
    setDailyBudget(campaign.dailyBudget);
    setStartDate(campaign.startDate.slice(0, 10));
    setEndDate(campaign.endDate ? campaign.endDate.slice(0, 10) : '');
    setDurationDays(
      campaign.dailyBudget > 0
        ? Math.max(1, Math.round(campaign.totalBudget / campaign.dailyBudget))
        : 1
    );
    setWizardStep(1);
    setShowAdWizard(true);
  };

  const togglePlatform = (platform: AdPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(item => item !== platform) : [...prev, platform]
    );
  };

  const handleWizardNext = () => {
    if (wizardStep === 1 && !selectedPropertyId) {
      setWizardError('Selecione um imovel para continuar.');
      return;
    }
    if (wizardStep === 2 && selectedPlatforms.length === 0) {
      setWizardError('Selecione pelo menos uma plataforma.');
      return;
    }
    if (wizardStep === 3 && !selectedObjective) {
      setWizardError('Escolha um objetivo para a campanha.');
      return;
    }
    setWizardError(null);
    setWizardStep(prev => Math.min(5, prev + 1));
  };

  const handleWizardBack = () => {
    setWizardError(null);
    setWizardStep(prev => Math.max(1, prev - 1));
  };

  const handleLaunchCampaign = async () => {
    if (!selectedPropertyId || !selectedObjective || selectedPlatforms.length === 0) {
      setWizardError('Preencha os campos obrigatorios antes de lancar.');
      return;
    }

    setWizardSubmitting(true);
    setWizardError(null);

    // TODO: enviar segmentacao basica (localizacao, idade, interesses) ao backend.
    const payloadBase = {
      name:
        campaignName ||
        propertyMap.get(selectedPropertyId)?.title ||
        'Nova campanha',
      propertyId: selectedPropertyId,
      objective: selectedObjective,
      dailyBudget,
      totalBudget,
      startDate: `${startDate}T00:00:00`,
      endDate: endDate ? `${endDate}T23:59:59` : undefined
    };

    try {
      await Promise.all(
        selectedPlatforms.map(platform =>
          createAdCampaign({
            ...payloadBase,
            platforms: [platform]
          })
        )
      );
      await loadAdsData();
      setShowAdWizard(false);
      resetWizard();
    } catch (error) {
      setWizardError('Nao foi possivel lancar a campanha.');
    } finally {
      setWizardSubmitting(false);
    }
  };
  const AdsManagerTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Meta Ads & Trafego</h3>
          <p className="text-sm text-gray-500">
            Gerencie campanhas multi-plataforma e monitore resultados em tempo real.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateWizard}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
        >
          <Zap size={16} /> Criar campanha de trafego
        </button>
      </div>

      {adsError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {adsError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {adsLoading
          ? Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`ads-skeleton-${index}`}
              className="rounded-3xl bg-white shadow-sm border border-slate-100 p-4 animate-pulse h-24"
            />
          ))
          : [
            {
              label: 'Investimento total',
              value: adsStats ? formatCurrency(adsStats.totalInvestment) : '--',
              icon: DollarSign
            },
            {
              label: 'Alcance (pessoas)',
              value: adsStats ? formatCompact(adsStats.totalReach) : '--',
              icon: Users
            },
            {
              label: 'Cliques no link',
              value: adsStats ? formatCompact(adsStats.totalClicks) : '--',
              icon: MousePointer
            },

            {
              label: 'Campanhas ativas',
              value: adsStats ? String(adsStats.activeCampaigns) : '--',
              icon: BarChart3
            }
          ].map(card => (
            <div
              key={card.label}
              className="rounded-3xl bg-white shadow-sm border border-slate-100 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  {card.label}
                </p>
                <card.icon size={16} className="text-gray-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
      </div>

      <div className="rounded-3xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Campanhas</h4>
            <p className="text-xs text-gray-500">Visao consolidada de performance e status.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[60rem] w-full text-left text-sm">
            <thead className="bg-slate-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3">Campanha / Imovel</th>
                <th className="px-5 py-3">Plataformas</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Orcamento</th>
                <th className="px-5 py-3">Leads / Cliques</th>
                <th className="px-5 py-3">CTR / CPL</th>
                <th className="px-5 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {adsCampaigns.map(campaign => {
                const property = campaign.propertyId
                  ? propertyMap.get(campaign.propertyId)
                  : null;
                const ctr =
                  campaign.ctr ??
                  (campaign.impressions > 0
                    ? (campaign.clicks / campaign.impressions) * 100
                    : 0);
                const cpl =
                  campaign.cpl ?? (campaign.leads > 0 ? campaign.spent / campaign.leads : null);

                const platformMeta = platformOptions.find(
                  platform => platform.id === campaign.platform
                );

                const statusMap = {
                  active: 'bg-emerald-100 text-emerald-700',
                  paused: 'bg-amber-100 text-amber-700',
                  ended: 'bg-slate-100 text-slate-600'
                } as const;

                return (
                  <tr key={campaign.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={campaign.thumbnail}
                          alt={campaign.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{campaign.name}</p>
                          <p className="text-xs text-gray-500">
                            {property?.title || 'Imovel nao vinculado'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {platformMeta ? (
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${platformMeta.pill}`}
                        >
                          <platformMeta.icon size={12} />
                          {platformMeta.label}
                          {campaign.platform === 'meta' && (
                            <span className="flex items-center gap-1 text-[0.625rem] text-gray-500">
                              <Instagram size={10} /> <Facebook size={10} />
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${statusMap[campaign.status]}`}
                      >
                        {campaign.status === 'active'
                          ? 'Ativa'
                          : campaign.status === 'paused'
                            ? 'Pausada'
                            : 'Encerrada'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(campaign.dailyBudget)}/dia
                      </p>
                      <p className="text-xs text-gray-500">Gasto {formatCurrency(campaign.spent)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-emerald-600">{campaign.leads} leads</p>
                      <p className="text-xs text-gray-500">{campaign.clicks} cliques</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">{ctr.toFixed(2)}%</p>
                      <p className="text-xs text-gray-500">
                        {cpl ? formatCurrency(cpl) : '--'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCampaign(campaign)}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                        >
                          <Eye size={12} /> Detalhes / Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => openBoostWizard(campaign)}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 hover:text-brand-700"
                        >
                          <Repeat size={12} /> Impulsionar novamente
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {adsCampaigns.length === 0 && !adsLoading && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-500">
                    Nenhuma campanha encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-8">
        <h2 className="text-2xl font-serif font-bold text-gray-900">Marketing Digital</h2>
        <p className="text-gray-500">Central de redes sociais e trafego pago.</p>
      </div>

      <div className="flex gap-6 border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('social')}
          className={`pb-4 px-2 font-bold text-sm transition-all relative ${activeTab === 'social' ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Gestao de Redes Sociais
          {activeTab === 'social' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('ads')}
          className={`pb-4 px-2 font-bold text-sm transition-all relative ${activeTab === 'ads' ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Meta Ads & Trafego
          {activeTab === 'ads' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === 'social' ? <SocialMediaTab /> : <AdsManagerTab />}

      {showAdWizard && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Passo {wizardStep} de 5
                </p>
                <h3 className="text-xl font-bold text-gray-900">
                  {wizardMode === 'boost' ? 'Impulsionar novamente' : 'Criar campanha'}
                </h3>
                <p className="text-sm text-gray-500">
                  Configure objetivo, publico e investimento para o imovel selecionado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAdWizard(false);
                  resetWizard();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
              {stepLabels.map((label, index) => {
                const stepNumber = index + 1;
                const isActive = wizardStep === stepNumber;
                const isComplete = wizardStep > stepNumber;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${isActive
                        ? 'bg-brand-600 text-white'
                        : isComplete
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-slate-100 text-slate-500'
                        }`}
                    >
                      {stepNumber}
                    </div>
                    <span
                      className={`text-xs ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-500'
                        }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-6 max-h-[65vh] overflow-y-auto">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="relative w-full">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={propertySearch}
                        onChange={event => setPropertySearch(event.target.value)}
                        placeholder="Busque por nome ou cidade"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-9 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProperties.map(property => (
                      <button
                        key={property.id}
                        type="button"
                        onClick={() => setSelectedPropertyId(property.id)}
                        className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${selectedPropertyId === property.id
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                      >
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{property.title}</p>
                          <p className="text-xs text-gray-500">
                            {property.city} - {property.state}
                          </p>
                          <p className="text-xs text-gray-500">{formatCurrency(property.price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Selecione os canais onde a campanha sera veiculada.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {platformOptions.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => togglePlatform(option.id)}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedPlatforms.includes(option.id)
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-slate-200 bg-white text-gray-600 hover:bg-slate-50'
                          }`}
                      >
                        <option.icon size={14} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Escolha o objetivo principal da campanha.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {objectiveOptions.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedObjective(option.id)}
                        className={`rounded-2xl border p-4 text-left transition ${selectedObjective === option.id
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <option.icon size={16} className="text-gray-500" />
                          <p className="font-semibold text-gray-900">{option.label}</p>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Configure um publico basico. Esses campos serao enviados ao backend.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Localizacao</label>
                      <input
                        value={audienceLocation}
                        onChange={event => setAudienceLocation(event.target.value)}
                        placeholder="Cidade ou estado"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Raio (km)</label>
                      <input
                        type="number"
                        value={audienceRadius}
                        onChange={event => setAudienceRadius(Number(event.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Idade minima</label>
                      <input
                        type="number"
                        value={audienceAgeMin}
                        onChange={event => setAudienceAgeMin(Number(event.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Idade maxima</label>
                      <input
                        type="number"
                        value={audienceAgeMax}
                        onChange={event => setAudienceAgeMax(Number(event.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Interesses basicos</label>
                    <textarea
                      value={audienceInterests}
                      onChange={event => setAudienceInterests(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      placeholder="Ex: financiamento, compra de imovel, investimento"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 5 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">
                        Orcamento diario (R$)
                      </label>
                      <input
                        type="number"
                        value={dailyBudget}
                        onChange={event => setDailyBudget(Number(event.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Duracao (dias)</label>
                      <input
                        type="number"
                        value={durationDays}
                        onChange={event => setDurationDays(Number(event.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Data de inicio</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={event => setStartDate(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Data de fim</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={event => setEndDate(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Resumo</p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Imovel</p>
                        <p className="font-semibold text-gray-900">
                          {propertyMap.get(selectedPropertyId)?.title || 'Nao selecionado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Plataformas</p>
                        <p className="font-semibold text-gray-900">
                          {selectedPlatforms.length > 0
                            ? selectedPlatforms.join(', ')
                            : 'Nao selecionadas'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Objetivo</p>
                        <p className="font-semibold text-gray-900">
                          {selectedObjective || 'Nao definido'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Publico</p>
                        <p className="font-semibold text-gray-900">
                          {audienceLocation || 'Nao definido'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Orcamento diario</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(dailyBudget)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total estimado</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(totalBudget)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {wizardError && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
                  {wizardError}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAdWizard(false);
                  resetWizard();
                }}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleWizardBack}
                  disabled={wizardStep === 1}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft size={16} /> Voltar
                </button>
                {wizardStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleWizardNext}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Avancar <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLaunchCampaign}
                    disabled={wizardSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                  >
                    Lancar campanha
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Detalhes da campanha</h3>
                <p className="text-sm text-gray-500">Informacoes gerais para revisao.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-xs text-gray-500">Campanha</p>
                <p className="font-semibold text-gray-900">{selectedCampaign.name}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Plataforma</p>
                  <p className="font-semibold text-gray-900">{selectedCampaign.platform}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Objetivo</p>
                  <p className="font-semibold text-gray-900">{selectedCampaign.objective}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Orcamento diario</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(selectedCampaign.dailyBudget)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Investimento total</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(selectedCampaign.totalBudget)}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketing;
