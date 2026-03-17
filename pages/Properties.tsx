
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, MapPin, Bed, Bath, Maximize, Heart, Map as MapIcon, Grid } from 'lucide-react';
import { api } from '../services/api';
import { Property, PropertyType } from '../types';
import { MOCK_CAMPAIGNS } from '../constants';
import PropertyMap from '../components/PropertyMap';

const Properties: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'all';
  const urlSearchTerm = searchParams.get('search') || '';
  const campaignId = searchParams.get('campaignId');

  // Local Filter State
  const [filterType, setFilterType] = useState<string>(initialType);
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');

  useEffect(() => {
    const fetchProps = async () => {
      const data = await api.properties.getAll();
      setProperties(data);
      setLoading(false);
    };
    fetchProps();
  }, []);

  // Sync state with URL changes
  useEffect(() => {
    setFilterType(searchParams.get('type') || 'all');
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
  };

  const handleFilterClick = (type: string) => {
    if (campaignId) {
      // Se estiver vendo uma campanha, clicar em um filtro deve remover a campanha e filtrar pelo tipo
      setSearchParams({ type });
    } else {
      if (type === 'all') {
        searchParams.delete('type');
        setSearchParams(searchParams);
      } else {
        setSearchParams({ type });
      }
    }
  };

  const filtered = properties.filter(p => {
    // If campaign filter is active, only show properties from that campaign
    if (campaignId) {
      return p.campaignIds?.includes(campaignId);
    }

    // Search Filter
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      const matches = p.title.toLowerCase().includes(lowerTerm) ||
        p.city.toLowerCase().includes(lowerTerm) ||
        p.address.toLowerCase().includes(lowerTerm);
      if (!matches) return false;
    }

    // Type Filter
    if (filterType !== 'all' && p.type !== filterType) return false;

    // Advanced Filters
    if (priceRange.min && p.price < Number(priceRange.min)) return false;
    if (priceRange.max && p.price > Number(priceRange.max)) return false;
    if (bedrooms && p.bedrooms < Number(bedrooms)) return false;
    if (bathrooms && p.bathrooms < Number(bathrooms)) return false;

    return true;
  });

  // Helper function to pluralize category names for the header
  const getHeaderTitle = () => {
    const count = filtered.length;

    if (campaignId) {
      const campaign = MOCK_CAMPAIGNS.find(c => c.id === campaignId);
      return campaign ? `${campaign.title} ` : 'Campanha';
    }

    if (filterType === 'all') return `${count} imóveis encontrados`;

    // Pluralization logic
    let typeName = filterType;
    if (filterType === 'Comercial') typeName = 'Imóveis Comerciais';
    else if (filterType === 'Terreno') typeName = 'Terrenos';
    else typeName = `${filterType}s`; // Casa -> Casas, Apartamento -> Apartamentos

    return `${count} ${typeName} encontrados`;
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Subheader Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-20 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">

            {/* Main Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto hide-scrollbar">
              <button
                onClick={() => handleFilterClick('all')}
                className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filterType === 'all' && !campaignId ? 'bg-brand-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} `}
              >
                Todos
              </button>
              {Object.values(PropertyType).map(type => (
                <button
                  key={type}
                  onClick={() => handleFilterClick(type)}
                  className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filterType === type && !campaignId ? 'bg-brand-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} `}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* View Toggle & More Filters */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              {/* IN-PAGE SEARCH INPUT */}
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none w-48 transition-all focus:w-64"
                />
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold transition-all ${showFilters ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <Filter className="w-4 h-4" /> Filtros
              </button>

              <div className="h-8 w-px bg-gray-300 mx-2 hidden md:block"></div>

              <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-900' : 'text-gray-400 hover:text-gray-600'} `}
                >
                  <Grid className="w-[1.125rem] h-[1.125rem]" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-brand-900' : 'text-gray-400 hover:text-gray-600'} `}
                >
                  <MapIcon className="w-[1.125rem] h-[1.125rem]" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Search Visible Only on Small Screens */}
          <div className="md:hidden relative mt-4">
            <input
              type="text"
              placeholder="Pesquisar imóvel..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          {/* EXPANDABLE FILTERS PANEL */}
          {showFilters && (
            <div className="pt-4 mt-4 border-t border-gray-100 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Preço Mínimo</label>
                  <input
                    type="number"
                    placeholder="R$ 0,00"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Preço Máximo</label>
                  <input
                    type="number"
                    placeholder="R$ ilimitado"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Quartos (Mín.)</label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 outline-none bg-white"
                  >
                    <option value="">Qualquer</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Banheiros (Mín.)</label>
                  <select
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 outline-none bg-white"
                  >
                    <option value="">Qualquer</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          {campaignId && (
            <Link to="/campaigns" className="text-sm text-brand-600 hover:underline mb-2 inline-block">
              &larr; Voltar para Campanhas
            </Link>
          )}
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            {getHeaderTitle()}
          </h1>
          {campaignId && (
            <p className="text-gray-500 mt-1">Exibindo ofertas exclusivas desta campanha.</p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-900"></div>
          </div>

        ) : viewMode === 'map' ? (
          <div className="bg-gray-200 rounded-3xl h-[37.5rem] flex items-center justify-center relative overflow-hidden border border-gray-300">
            {/* Integrated Leaflet Map */}
            <PropertyMap properties={filtered} />

            <div className="absolute top-4 right-4 z-[1000]">
              <button onClick={() => setViewMode('grid')} className="bg-white text-brand-900 px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-gray-50 transition-all text-sm border border-gray-200">
                Voltar para Lista
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map(property => (
              <div key={property.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                <div className="relative h-56 overflow-hidden">
                  <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white text-gray-400 hover:text-red-500 transition-colors shadow-sm z-10">
                    <Heart className="w-4 h-4" />
                  </button>
                  <div className="absolute top-3 left-3 bg-gray-900/90 backdrop-blur px-2 py-1 rounded-md text-white text-[0.625rem] font-bold uppercase tracking-wider">
                    {property.status === 'active' ? 'Disponível' : property.status}
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-gray-900/80 to-transparent">
                    <p className="text-white font-bold text-xl">{property.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-brand-600 text-[0.625rem] font-bold uppercase tracking-wider">{property.type}</span>
                    {property.featured && <span className="flex items-center gap-1 text-amber-500 text-[0.625rem] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Destaque</span>}
                  </div>

                  <Link to={`/properties/${property.id}`} className="block mb-1">
                    <h3 className="text-base font-bold text-gray-900 hover:text-brand-600 transition-colors line-clamp-1" title={property.title}>{property.title}</h3>
                  </Link>

                  <div className="flex items-center gap-1 text-gray-500 text-xs mb-4">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="truncate">{property.city}, {property.state}</span>
                  </div>

                  <div className="mt-auto pt-3 border-t border-gray-50">
                    <div className="flex justify-between text-gray-500">
                      <div className="flex items-center gap-1" title="Quartos">
                        <Bed className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-bold">{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Banheiros">
                        <Bath className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-bold">{property.bathrooms}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Área">
                        <Maximize className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-bold">{property.area} m²</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-4 py-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-lg">Nenhum imóvel encontrado nesta categoria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;