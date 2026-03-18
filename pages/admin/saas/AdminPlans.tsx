import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, Plus, Sparkles } from 'lucide-react';
import { SaaSPlan, saasModules, saasPlans } from './adminSaasMockData';

type PlanFormState = {
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly?: number;
  maxUsers?: number;
  maxProperties?: number;
  maxWhatsAppMessages?: number;
  maxCampaigns?: number;
  modulesIncluded: string[];
  isRecommended?: boolean;
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const AdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const loadPlans = async () => {
    try {
      const res = await fetch('/api/saas/plans');
      const data = await res.json();
      setPlans(data);
    } catch(err) { console.error('Error fetching plans', err); }
  };

  useEffect(() => {
    loadPlans();
  }, []);
  const [formState, setFormState] = useState<PlanFormState>({
    name: '',
    description: '',
    priceMonthly: 0,
    priceYearly: 0,
    maxUsers: 0,
    maxProperties: 0,
    maxWhatsAppMessages: 0,
    maxCampaigns: 0,
    modulesIncluded: [],
    isRecommended: false
  });

  const planMap = useMemo(() => {
    return plans.reduce<Record<string, SaaSPlan>>((acc, plan) => {
      acc[plan.id] = plan;
      return acc;
    }, {});
  }, [plans]);

  const openCreateModal = () => {
    setEditingPlanId(null);
    setFormState({
      name: '',
      description: '',
      priceMonthly: 0,
      priceYearly: 0,
      maxUsers: 0,
      maxProperties: 0,
      maxWhatsAppMessages: 0,
      maxCampaigns: 0,
      modulesIncluded: [],
      isRecommended: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (planId: string) => {
    const plan = planMap[planId];
    if (!plan) {
      return;
    }
    setEditingPlanId(planId);
    setFormState({
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly ?? 0,
      maxUsers: plan.maxUsers ?? 0,
      maxProperties: plan.maxProperties ?? 0,
      maxWhatsAppMessages: plan.maxWhatsAppMessages ?? 0,
      maxCampaigns: plan.maxCampaigns ?? 0,
      modulesIncluded: [...plan.modulesIncluded],
      isRecommended: plan.isRecommended ?? false
    });
    setIsModalOpen(true);
  };

  const toggleModule = (key: string) => {
    setFormState(prev => {
      const exists = prev.modulesIncluded.includes(key);
      return {
        ...prev,
        modulesIncluded: exists
          ? prev.modulesIncluded.filter(item => item !== key)
          : [...prev.modulesIncluded, key]
      };
    });
  };

  const handleSave = async () => {
    const payload = {
      name: formState.name,
      description: formState.description,
      priceMonthly: Number(formState.priceMonthly),
      priceYearly: Number(formState.priceYearly) || undefined,
      maxUsers: Number(formState.maxUsers) || undefined,
      maxProperties: Number(formState.maxProperties) || undefined,
      maxWhatsAppMessages: Number(formState.maxWhatsAppMessages) || undefined,
      maxCampaigns: Number(formState.maxCampaigns) || undefined,
      modulesIncluded: formState.modulesIncluded as SaaSPlan['modulesIncluded'],
      isRecommended: formState.isRecommended
    };

    try {
      if (editingPlanId) {
        await fetch(`/api/saas/plans/${editingPlanId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/saas/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      await loadPlans();
      setIsModalOpen(false);
    } catch(err) {
      console.error('Error saving plan', err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Planos e precos</h2>
          <p className="text-sm text-gray-500">
            Edite limites, modulos e posicionamento comercial dos planos.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-[1.125rem] h-[1.125rem]" />
          Criar novo plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border shadow-sm p-6 bg-white ${plan.isRecommended ? 'border-brand-500 ring-1 ring-brand-300' : 'border-gray-100'
              }`}
          >
            {plan.isRecommended && (
              <span className="absolute -top-3 left-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-brand-600 text-white">
                <Sparkles className="w-3 h-3" />
                Recomendado
              </span>
            )}
            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
            <div className="mt-5">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(plan.priceMonthly)}
                <span className="text-sm font-semibold text-gray-500">/mes</span>
              </p>
              {plan.priceYearly && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(plan.priceYearly)} anual
                </p>
              )}
            </div>
            <div className="mt-5 space-y-2 text-sm text-gray-600">
              <p>Usuarios: {plan.maxUsers ?? 'Ilimitado'}</p>
              <p>Imoveis: {plan.maxProperties ?? 'Ilimitado'}</p>
              <p>WhatsApp: {plan.maxWhatsAppMessages ?? 'Ilimitado'}</p>
              <p>Campanhas: {plan.maxCampaigns ?? 'Ilimitado'}</p>
            </div>
            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-400 uppercase">Modulos</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {plan.modulesIncluded.map(moduleKey => (
                  <span
                    key={moduleKey}
                    className="px-2 py-1 rounded-full text-[0.6875rem] font-semibold bg-gray-100 text-gray-600"
                  >
                    {saasModules.find(module => module.key === moduleKey)?.name ?? moduleKey}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => openEditModal(plan.id)}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Editar plano
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingPlanId ? 'Editar plano' : 'Criar novo plano'}
            </h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-xs font-semibold text-gray-500">Nome</label>
                <input
                  value={formState.name}
                  onChange={event => setFormState({ ...formState, name: event.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Preco mensal</label>
                <input
                  type="number"
                  value={formState.priceMonthly}
                  onChange={event =>
                    setFormState({ ...formState, priceMonthly: Number(event.target.value) })
                  }
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Preco anual</label>
                <input
                  type="number"
                  value={formState.priceYearly}
                  onChange={event =>
                    setFormState({ ...formState, priceYearly: Number(event.target.value) })
                  }
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Usuarios max</label>
                <input
                  type="number"
                  value={formState.maxUsers}
                  onChange={event =>
                    setFormState({ ...formState, maxUsers: Number(event.target.value) })
                  }
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Imoveis max</label>
                <input
                  type="number"
                  value={formState.maxProperties}
                  onChange={event =>
                    setFormState({ ...formState, maxProperties: Number(event.target.value) })
                  }
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Disparos WhatsApp</label>
                <input
                  type="number"
                  value={formState.maxWhatsAppMessages}
                  onChange={event =>
                    setFormState({
                      ...formState,
                      maxWhatsAppMessages: Number(event.target.value)
                    })
                  }
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Campanhas ativas</label>
                <input
                  type="number"
                  value={formState.maxCampaigns}
                  onChange={event =>
                    setFormState({ ...formState, maxCampaigns: Number(event.target.value) })
                  }
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500">Descricao</label>
                <textarea
                  value={formState.description}
                  onChange={event => setFormState({ ...formState, description: event.target.value })}
                  rows={3}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500">Modulos incluidos</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {saasModules.map(module => {
                    const checked = formState.modulesIncluded.includes(module.key);
                    return (
                      <label
                        key={module.key}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${checked ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleModule(module.key)}
                          className="accent-brand-600"
                        />
                        {module.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                <input
                  type="checkbox"
                  checked={Boolean(formState.isRecommended)}
                  onChange={event => setFormState({ ...formState, isRecommended: event.target.checked })}
                  className="accent-brand-600"
                />
                Marcar como recomendado
              </label>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
              >
                Salvar plano
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlans;
