import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Timer, ArrowRight, Percent, CheckCircle, Info } from 'lucide-react';
import { api } from '../services/api';
import { Campaign } from '../types';

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const data = await api.campaigns.getAll();
      setCampaigns(data);
    };
    fetch();
  }, []);

  return (
    <div className="bg-white min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <span className="text-brand-600 font-bold tracking-widest text-xs uppercase mb-2 block">Oportunidades Exclusivas</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">Campanhas Ativas</h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Selecionamos as melhores condições do mercado para você realizar seu sonho.
            Descontos reais, facilidades de pagamento e benefícios que só nossos parceiros oferecem.
          </p>
        </div>

        <div className="space-y-12">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="group relative rounded-3xl overflow-hidden bg-gray-900 shadow-2xl isolate">
              <img
                src={campaign.image}
                alt={campaign.title}
                className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
              />
              <div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-amber-400 font-bold mb-4">
                    <Timer size={18} />
                    <span className="uppercase tracking-widest text-xs">Válido até {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Indeterminado'}</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6 leading-tight">{campaign.title}</h2>
                  <p className="text-lg text-gray-300 mb-8 max-w-xl leading-relaxed">{campaign.description}</p>

                  {/* Benefits List */}
                  <ul className="space-y-3 mb-10">
                    <li className="flex items-center gap-3 text-gray-200">
                      <CheckCircle size={20} className="text-brand-500" />
                      <span className="font-medium">Entrada facilitada em até 60x direto com a construtora</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-200">
                      <CheckCircle size={20} className="text-brand-500" />
                      <span className="font-medium">Documentação Grátis (ITBI + Registro) inclusa</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-200">
                      <CheckCircle size={20} className="text-brand-500" />
                      <span className="font-medium">Aprovação de crédito em 24h sem burocracia</span>
                    </li>
                  </ul>

                  <Link
                    to={`/properties?campaignId=${campaign.id}`}
                    className="inline-flex bg-brand-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-700 transition-colors items-center gap-2 shadow-lg shadow-brand-600/20 transform hover:-translate-y-1"
                  >
                    Ver Imóveis Elegíveis <ArrowRight size={18} />
                  </Link>

                  {/* Legal Note */}
                  <p className="mt-8 text-xs text-gray-500 flex items-start gap-2 max-w-lg opacity-70">
                    <Info size={14} className="flex-shrink-0 mt-0.5" />
                    *Condições válidas apenas para unidades selecionadas. Sujeito à análise de crédito e disponibilidade de estoque. Consulte o regulamento completo na central de vendas.
                  </p>
                </div>

                {campaign.discountPercentage && (
                  <div className="flex-shrink-0 bg-white/5 backdrop-blur-md p-10 rounded-[2rem] border border-white/10 text-center transform group-hover:scale-105 transition-transform shadow-2xl">
                    <Percent className="w-12 h-12 text-amber-400 mx-auto mb-2" />
                    <p className="text-6xl font-bold text-white tracking-tighter">{campaign.discountPercentage}%</p>
                    <p className="text-amber-400 font-bold uppercase tracking-widest text-sm mt-2">De Desconto</p>
                    <div className="w-12 h-1 bg-amber-400 mx-auto mt-4 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Campaigns;