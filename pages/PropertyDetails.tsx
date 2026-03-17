
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, Check, Share2, Heart, MessageCircle, User, ArrowRight, HardHat, Calendar, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import { Property } from '../types';
import { APP_CONFIG, MOCK_PROPERTIES } from '../constants';

const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | undefined>(undefined);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      if (id) {
        const data = await api.properties.getById(id);
        setProperty(data);

        // Simulate finding similar properties (excluding current one)
        const similar = MOCK_PROPERTIES.filter(p => p.id !== id).slice(0, 3);
        setSimilarProperties(similar);
      }
      setLoading(false);
    };
    fetch();
    window.scrollTo(0, 0); // Reset scroll on navigation
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-900"></div>
  </div>;

  if (!property) return <div className="min-h-screen flex items-center justify-center">Imóvel não encontrado.</div>;

  const isRental = property.businessType === 'RENT';

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Modern Grid Gallery (Desktop) & Slider (Mobile) */}
      <div className="container mx-auto px-4 pt-6 pb-6 hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[37.5rem]">
        {property.images.slice(0, 5).map((img, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden cursor-pointer group rounded-xl ${idx === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'}`}
            onClick={() => setActiveImage(idx)}
          >
            <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
            {idx === 4 && property.images.length > 5 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl backdrop-blur-sm group-hover:bg-black/40 transition-all">
                +{property.images.length - 5} fotos
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Header Image */}
      <div className="md:hidden h-[50vh] relative">
        <img src={property.images[activeImage]} className="w-full h-full object-cover" alt="" />
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {activeImage + 1} / {property.images.length}
        </div>
      </div>

      <div className="container mx-auto px-4 pt-4 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">

          {/* Header Info */}
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{property.type}</span>
              {property.businessType === 'RENT' || property.businessType === 'BOTH' ? (
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Locação</span>
              ) : (
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Venda</span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-2">{property.title}</h1>
            <div className="flex items-center gap-2 text-gray-500 text-lg">
              <MapPin className="w-5 h-5 text-brand-600" /> {property.address} - {property.city}/{property.state}
            </div>

            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 items-baseline">
              {isRental ? (
                <p className="text-4xl font-bold text-blue-700">
                  {property.rentPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}<span className="text-lg font-normal text-gray-500">/mês</span>
                </p>
              ) : (
                <p className="text-4xl font-bold text-brand-900">
                  {property.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              )}

              {/* Costs Breakdown */}
              <div className="flex gap-4 text-sm text-gray-500">
                {(property.condoPrice || 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-gray-700">Cond:</span> {property.condoPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                )}
                {(property.iptuPrice || 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-gray-700">IPTU:</span> {property.iptuPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-50 rounded-xl text-brand-600"><Bed className="w-6 h-6" /></div>
              <div><p className="font-bold text-gray-900 text-lg">{property.bedrooms}</p><p className="text-xs text-gray-500">Quartos</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-50 rounded-xl text-brand-600"><Bath className="w-6 h-6" /></div>
              <div><p className="font-bold text-gray-900 text-lg">{property.bathrooms}</p><p className="text-xs text-gray-500">Banheiros</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-50 rounded-xl text-brand-600"><Maximize className="w-6 h-6" /></div>
              <div><p className="font-bold text-gray-900 text-lg">{property.area} m²</p><p className="text-xs text-gray-500">Área Útil</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-50 rounded-xl text-brand-600"><Check className="w-6 h-6" /></div>
              <div><p className="font-bold text-gray-900 text-lg">{property.suites}</p><p className="text-xs text-gray-500">Suítes</p></div>
            </div>
          </div>

          {/* Description */}
          <section>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Sobre o Imóvel</h2>
            <div className="prose prose-lg text-gray-600 leading-relaxed whitespace-pre-wrap">
              {property.description}
            </div>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Diferenciais</h2>
            <div className="grid grid-cols-2 gap-4">
              {property.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:border-brand-200 transition-colors">
                  <Check className="w-[1.125rem] h-[1.125rem] text-brand-500" />
                  <span className="text-gray-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Sticky */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">

            {/* Construction Status Widget (Only for Launches) */}
            {property.launchDetails && (
              <div className="bg-gray-900 rounded-[2rem] p-8 shadow-xl text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-amber-500 p-2 rounded-lg text-gray-900"><HardHat className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">Status da Obra</p>
                    <p className="font-bold text-lg">{property.launchDetails.stage}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Progresso</span>
                    <span className="text-amber-500">{property.launchDetails.constructionProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${property.launchDetails.constructionProgress}%` }}></div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Previsão de Entrega</p>
                    <p className="font-bold">{property.launchDetails.deliveryDate}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Consultor Responsável</p>
                  <p className="font-bold text-xl text-gray-900">Eduardo Santos</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 font-bold mt-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Online agora</p>
                </div>
              </div>

              <div className="space-y-4">
                <a
                  href={`https://wa.me/${APP_CONFIG.whatsapp}?text=Olá, tenho interesse no imóvel ${property.title} (ID: ${property.id})`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-500/30 transform hover:-translate-y-1"
                >
                  <MessageCircle className="w-5 h-5" /> Chamar no WhatsApp
                </a>

                <button className="flex items-center justify-center gap-3 w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-gray-900/20 transform hover:-translate-y-1">
                  Agendar Visita
                </button>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-bold text-sm transition-colors">
                    <Heart className="w-[1.125rem] h-[1.125rem]" /> Salvar
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-bold text-sm transition-colors">
                    <Share2 className="w-[1.125rem] h-[1.125rem]" /> Enviar
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Summary Widget */}
            <div className="bg-brand-50 rounded-3xl p-6 border border-brand-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-[1.125rem] h-[1.125rem]" /> Resumo Financeiro
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{isRental ? 'Aluguel' : 'Valor Venda'}</span>
                  <span className="font-bold text-gray-900">
                    {isRental ? property.rentPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : property.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Condomínio</span>
                  <span className="font-bold text-gray-900">{property.condoPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IPTU (Mensal)</span>
                  <span className="font-bold text-gray-900">{property.iptuPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>

                {isRental && (
                  <div className="pt-3 border-t border-brand-200 flex justify-between">
                    <span className="font-bold text-brand-700">Pacote Mensal</span>
                    <span className="font-bold text-brand-700 text-lg">
                      {((property.rentPrice || 0) + (property.condoPrice || 0) + (property.iptuPrice || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                )}
              </div>

              {!isRental && (
                <div className="mt-4 pt-4 border-t border-brand-200">
                  <p className="text-xs text-gray-500 mb-2">Simulação de Financiamento</p>
                  <Link to="/buyer/dashboard" className="text-brand-600 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                    Simular Parcelas <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Similar Properties Section */}
      <div className="bg-gray-50 py-16 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-10">Você também pode gostar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {similarProperties.map(p => (
              <Link to={`/properties/${p.id}`} key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                <div className="h-48 overflow-hidden relative">
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-gray-900">
                    {p.businessType === 'RENT'
                      ? p.rentPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-1 truncate">{p.title}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.city}</p>
                  <div className="flex gap-4 mt-4 text-xs text-gray-500 font-medium">
                    <span className="flex gap-1 items-center"><Bed className="w-3.5 h-3.5" /> {p.bedrooms}</span>
                    <span className="flex gap-1 items-center"><Maximize className="w-3.5 h-3.5" /> {p.area}m²</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
