
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Home, Key } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Property } from '../../types';

const PropertiesList: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  /* New state for property approval tab */
  const [filterType, setFilterType] = useState<'ALL' | 'SALE' | 'RENT' | 'PENDING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      // Include unpublished to fetch pending
      const data = await api.properties.getAll({ includeUnpublished: true });
      setProperties(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const filteredProperties = properties.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'PENDING') return p.status === 'pending';

    // Hide pending from other tabs
    if (p.status === 'pending') return false;

    if (filterType === 'ALL') return true;
    if (filterType === 'SALE') return p.businessType === 'SALE' || p.businessType === 'BOTH';
    if (filterType === 'RENT') return p.businessType === 'RENT' || p.businessType === 'BOTH';
    return true;
  });

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Deseja remover este imovel? Esta acao nao pode ser desfeita.');
    if (!confirmed) return;
    await api.properties.delete(id);
    setProperties(prev => prev.filter(property => property.id !== id));
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Gestão de Imóveis</h2>
          <p className="text-gray-500 text-sm">Gerencie seu portfólio de vendas e locação</p>
        </div>
        <Link
          to="/admin/properties/new"
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-700 flex items-center gap-2 shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-5 h-5" /> Novo Imóvel
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">

          {/* Business Type Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${filterType === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('SALE')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${filterType === 'SALE' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Venda
            </button>
            <button
              onClick={() => setFilterType('RENT')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${filterType === 'RENT' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Locação
            </button>
            {/* New Tab for Pending Requests */}
            <button
              onClick={() => setFilterType('PENDING')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${filterType === 'PENDING' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Solicitações
              {properties.filter(p => p.status === 'pending').length > 0 && (
                <span className="bg-red-500 text-white text-[0.625rem] px-1.5 py-0.5 rounded-full">
                  {properties.filter(p => p.status === 'pending').length}
                </span>
              )}
            </button>
          </div>

          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por título, código ou cidade..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Imóvel</th>
                <th className="px-6 py-4">Finalidade</th>
                <th className="px-6 py-4">Valor Principal</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProperties.map(property => (
                <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={property.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        {property.status === 'pending' && <span className="text-[0.625rem] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mb-1 inline-block">Análise</span>}
                        <p className="font-bold text-gray-900">{property.title}</p>
                        <p className="text-gray-500 text-xs">{property.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {(property.businessType === 'SALE' || property.businessType === 'BOTH') && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
                          <Home className="w-3 h-3" /> Venda
                        </span>
                      )}
                      {(property.businessType === 'RENT' || property.businessType === 'BOTH') && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700">
                          <Key className="w-3 h-3" /> Locação
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex flex-col">
                      {(property.businessType === 'SALE' || property.businessType === 'BOTH') && (
                        <span>{property.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      )}
                      {(property.businessType === 'RENT' || property.businessType === 'BOTH') && (
                        <span className="text-blue-600 text-xs">
                          {property.rentPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${property.published === false && property.status !== 'pending'
                      ? 'bg-gray-100 text-gray-800'
                      : property.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : property.status === 'rented'
                          ? 'bg-blue-100 text-blue-800'
                          : property.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                      {property.published === false && property.status !== 'pending'
                        ? 'Inativo'
                        : property.status === 'active'
                          ? 'Disponível'
                          : property.status === 'rented'
                            ? 'Alugado'
                            : property.status === 'pending'
                              ? 'Pendente Aprovação'
                              : 'Vendido'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/properties/edit/${property.id}`)}
                        className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-[1.125rem] h-[1.125rem]" />
                      </button>
                      <button
                        onClick={() => handleDelete(property.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-[1.125rem] h-[1.125rem]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="p-8 text-center text-gray-500">Carregando imóveis...</div>}
      </div>
    </div>
  );
};

export default PropertiesList;