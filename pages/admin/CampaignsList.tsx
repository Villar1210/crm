import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Calendar, Percent, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../../services/api';
import { Campaign } from '../../types';

const CampaignsList: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await api.campaigns.getAll();
      setCampaigns(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const toggleStatus = (id: string) => {
    setCampaigns(campaigns.map(c =>
      c.id === id ? { ...c, active: !c.active } : c
    ));
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Gestão de Campanhas</h2>
          <p className="text-gray-500 text-sm">Gerencie promoções, ofertas sazonais e banners do site.</p>
        </div>
        <button onClick={() => window.location.hash = '/admin/campaigns/new'} className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-700 flex items-center gap-2 shadow-lg shadow-brand-500/20">
          <Plus className="w-5 h-5" /> Nova Campanha
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar campanhas..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Campanha</th>
                <th className="px-6 py-4">Vigência</th>
                <th className="px-6 py-4">Benefício</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map(campaign => (
                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={campaign.image} alt="" className="w-16 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-gray-900">{campaign.title}</p>
                        <p className="text-gray-500 text-xs truncate max-w-[12.5rem]">{campaign.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Até {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Indeterminado'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {campaign.discountPercentage ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        <Percent className="w-2.5 h-2.5" /> {campaign.discountPercentage}% OFF
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleStatus(campaign.id)} className={`flex items-center gap-2 transition-colors ${campaign.active ? 'text-green-600' : 'text-gray-400'}`}>
                      {campaign.active ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                      <span className="text-xs font-bold">{campaign.active ? 'Ativa' : 'Pausada'}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Ver página">
                        <Eye className="w-[1.125rem] h-[1.125rem]" />
                      </button>
                      <button onClick={() => window.location.hash = `/admin/campaigns/edit/${campaign.id}`} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <Edit2 className="w-[1.125rem] h-[1.125rem]" />
                      </button>
                      <button onClick={async () => {
                        if (confirm('Confirmar exclusão?')) {
                          await api.campaigns.delete(campaign.id);
                          setCampaigns(campaigns.filter(c => c.id !== campaign.id));
                        }
                      }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-[1.125rem] h-[1.125rem]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="p-8 text-center text-gray-500">Carregando campanhas...</div>}
      </div>
    </div>
  );
};

export default CampaignsList;