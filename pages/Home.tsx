
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, MapPin, Bed, Bath, Maximize, Zap, ChevronRight, MessageCircle, Shield, CheckCircle } from 'lucide-react';
import { MOCK_PROPERTIES, MOCK_CAMPAIGNS, APP_CONFIG } from '../constants';
import { PropertyType, HeroSlide } from '../types';
import { api } from '../services/api';

const Home: React.FC = () => {
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);

  useEffect(() => {
    const fetchSlides = async () => {
      const slides = await api.content.getHeroSlides();
      setHeroSlides(slides.filter(s => s.active));
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    if (heroSlides.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  // Limiting to 3 cards per section as requested
  const featuredProperties = MOCK_PROPERTIES.filter(p => p.featured && p.type !== PropertyType.LAUNCH).slice(0, 3);
  const launchProperties = MOCK_PROPERTIES.filter(p => p.type === PropertyType.LAUNCH).slice(0, 3);

  const activeCampaigns = MOCK_CAMPAIGNS.slice(0, 2);
  const isSingleCampaign = activeCampaigns.length === 1;

  const lifestyles = [
    { title: "Apartamentos", type: PropertyType.APARTMENT, image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", count: 42 },
    { title: "Casas", type: PropertyType.HOUSE, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", count: 28 },
    { title: "Coberturas", type: PropertyType.APARTMENT, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", count: 12 },
    { title: "Investimentos", type: PropertyType.COMMERCIAL, image: "https://images.unsplash.com/photo-1460472178825-e5240623afd5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", count: 15 },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        {heroSlides.length > 0 ? (
          <>
            <div className="absolute inset-0 z-0 bg-gray-900">
              {heroSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${index === heroIndex ? 'opacity-100' : 'opacity-0'}`}
                >
                  <img
                    src={slide.image}
                    alt="Hero"
                    className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${index === heroIndex ? 'scale-110' : 'scale-100'}`}
                  />
                </div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-gray-900/30"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10 pt-20 text-center md:text-left">
              <div className="max-w-4xl mx-auto md:mx-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <span className="inline-block px-4 py-1.5 rounded-full bg-brand-600 text-white text-xs font-bold tracking-widest uppercase mb-6 shadow-lg border border-white/10">
                  {APP_CONFIG.companyName}
                </span>
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight drop-shadow-2xl">
                  {heroSlides[heroIndex].title}
                </h1>
                <p className="text-xl text-gray-200 mb-10 font-medium max-w-2xl mx-auto md:mx-0 leading-relaxed drop-shadow-md">
                  {heroSlides[heroIndex].subtitle}
                </p>

                {/* CTA - Focus on Launches only */}
                <div className="max-w-4xl mx-auto md:mx-0">
                  <Link
                    to="/properties?type=Lançamento"
                    className="inline-flex items-center gap-3 bg-white text-brand-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-brand-50 hover:scale-105 transition-all shadow-2xl group ring-4 ring-white/20"
                  >
                    <Star className="text-amber-500 fill-amber-500 group-hover:rotate-12 transition-transform w-5 h-5" />
                    <span>Ver Lançamentos</span>
                    <ArrowRight className="text-brand-600 group-hover:translate-x-1 transition-transform w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-900 text-white">Carregando...</div>
        )}
      </section>

      {/* Stats Section */}
      <div className="bg-white py-12 border-b border-gray-100 relative z-20 container mx-auto rounded-b-3xl shadow-sm mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-100">
          <div>
            <p className="text-3xl md:text-4xl font-serif font-bold text-brand-900 mb-1">15+</p>
            <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">Anos de Mercado</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-serif font-bold text-brand-900 mb-1">5k+</p>
            <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">Imóveis Vendidos</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-serif font-bold text-brand-900 mb-1">10k+</p>
            <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">Clientes Felizes</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-serif font-bold text-brand-900 mb-1">Top 1</p>
            <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">Em Exclusividade</p>
          </div>
        </div>
      </div>

      {/* Lifestyle Section (Busque pelo seu Momento) */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-serif font-bold text-gray-900">Busque pelo seu Momento</h2>
              <p className="text-gray-500 mt-2">Escolha a categoria que combina com sua fase de vida.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {lifestyles.map((style, idx) => (
              <Link to={`/properties?type=${style.type}`} key={idx} className="relative h-48 rounded-2xl overflow-hidden group cursor-pointer shadow-md block transition-transform hover:-translate-y-1">
                <img src={style.image} alt={style.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4 w-full">
                  <h3 className="text-lg font-bold text-white mb-0.5">{style.title}</h3>
                  <div className="flex items-center gap-2 text-gray-300 text-xs">
                    <span>{style.count} imóveis</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collection (Imóveis Oportunidades - Light Theme) */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-6">
            <div>
              <span className="text-brand-600 font-bold tracking-widest text-xs uppercase bg-white border border-brand-100 px-3 py-1 rounded-full mb-3 inline-block shadow-sm">Oportunidades</span>
              <h2 className="text-3xl font-serif font-bold text-gray-900 leading-tight">Destaques & Oportunidades</h2>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/properties" className="text-sm font-bold text-gray-600 hover:text-brand-600 transition-colors">Ver todos</Link>
              <Link to="/properties" className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full text-brand-900 hover:bg-brand-600 hover:text-white transition-all shadow-sm">
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Grid Layout - 3 Cols */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredProperties.map((property) => (
              <Link
                to={`/properties/${property.id}`}
                key={property.id}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col w-full h-full border border-gray-100"
              >
                {/* Image Height h-52 */}
                <div className="relative h-52 w-full overflow-hidden flex-shrink-0">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="bg-white/95 text-brand-900 text-[0.625rem] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm border border-gray-100 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> Destaque
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-base font-bold text-white tracking-tight">
                      {property.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>

                {/* Content Area - Compact Padding p-3 */}
                <div className="p-3 flex flex-col flex-1 justify-between">
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[0.625rem] font-bold text-brand-600 uppercase tracking-wider">{property.type}</span>
                      <div className="flex items-center gap-1 text-[0.625rem] text-gray-500">
                        <MapPin className="w-2.5 h-2.5" /> {property.city}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-1 mb-0.5">
                      {property.title}
                    </h3>
                    <p className="text-[0.625rem] text-gray-500 line-clamp-1">
                      {property.address}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-gray-500 text-[0.625rem]">
                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-lg"><Bed className="w-3 h-3 text-gray-400" /> {property.bedrooms}</span>
                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-lg"><Bath className="w-3 h-3 text-gray-400" /> {property.bathrooms}</span>
                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-lg"><Maximize className="w-3 h-3 text-gray-400" /> {property.area} m²</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Lançamentos Section (Premium Dark Theme) - Structurally Identical */}
      <section className="py-16 bg-gray-900 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[50rem] h-[50rem] bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10 max-w-6xl">
          {/* Header Premium */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-6">
            <div>
              <span className="text-amber-400 font-bold tracking-widest text-xs uppercase bg-gray-800 border border-gray-700 px-3 py-1 rounded-full mb-3 inline-block shadow-lg">Em Obras & Lançamentos</span>
              <h2 className="text-3xl font-serif font-bold text-white leading-tight">Lançamentos Exclusivos</h2>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/properties?type=Lançamento" className="text-sm font-bold text-gray-400 hover:text-amber-400 transition-colors">Ver todos</Link>
              <Link to="/properties?type=Lançamento" className="w-10 h-10 flex items-center justify-center bg-gray-800 border border-gray-700 rounded-full text-white hover:bg-amber-500 hover:border-amber-500 hover:text-gray-900 transition-all shadow-lg shadow-black/20">
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Revamped Grid - EXACT same structure as Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {launchProperties.map(launch => (
              <Link
                to={`/properties/${launch.id}`}
                key={launch.id}
                className="group bg-gray-800 rounded-xl overflow-hidden shadow-xl hover:shadow-amber-900/20 transition-all duration-300 flex flex-col w-full h-full border border-gray-700 hover:border-amber-500/50"
              >
                {/* Image - Matched to h-52 like Opportunities */}
                <div className="relative h-52 w-full overflow-hidden flex-shrink-0">
                  <img
                    src={launch.images[0]}
                    alt={launch.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  {/* Badges */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-amber-500 text-gray-900 text-[0.625rem] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-gray-900" /> Lançamento
                    </span>
                  </div>

                  {/* Price Overlay - Exact match to Opportunities */}
                  <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-gray-900 to-transparent">
                    <p className="text-base font-bold text-white tracking-tight">
                      {launch.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                {/* Body Content - Compact (p-3) like Opportunities */}
                <div className="p-3 flex flex-col flex-1 justify-between bg-gray-800 relative z-10">

                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[0.625rem] font-bold text-amber-500 uppercase tracking-wider">Lançamento</span>
                      <div className="flex items-center gap-1 text-[0.625rem] text-gray-400">
                        <MapPin className="w-2.5 h-2.5" /> {launch.city}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 mb-0.5">
                      {launch.title}
                    </h3>
                    <div className="flex items-center gap-1 text-[0.625rem] text-gray-500 line-clamp-1">
                      {launch.address}
                    </div>
                  </div>

                  {/* Footer Area - Replaces Icons with Progress Bar */}
                  <div className="pt-2 border-t border-gray-700 flex flex-col justify-center h-[1.625rem]">
                    {launch.launchDetails ? (
                      <div className="w-full flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400" style={{ width: `${launch.launchDetails.constructionProgress}%` }}></div>
                        </div>
                        <span className="text-[0.5625rem] font-bold text-amber-400 uppercase tracking-wider whitespace-nowrap">
                          {launch.launchDetails.constructionProgress}% Obra
                        </span>
                      </div>
                    ) : (
                      <span className="text-[0.625rem] text-gray-500 italic">Em breve</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Campaign Banner - Compact Size with Hover & Pulse Effects */}
      {activeCampaigns.length > 0 && (
        <section className="py-16 container mx-auto px-4 max-w-6xl">
          <div className={`grid gap-6 ${!isSingleCampaign ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {activeCampaigns.map((campaign, idx) => (
              <div
                key={campaign.id}
                className={`
                    relative overflow-hidden bg-gray-900 text-white shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-brand-900/40 hover:-translate-y-1
                    ${isSingleCampaign ? 'rounded-[2rem]' : 'rounded-[1.5rem] h-full flex flex-col justify-end group'}
                    ${idx === 0 ? 'ring-2 ring-amber-500/50' : ''}
                `}
              >
                {/* Blinking Badge for first campaign */}
                {idx === 0 && (
                  <div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-amber-500 text-gray-900 px-3 py-1 rounded-full text-[0.625rem] font-bold uppercase shadow-lg animate-pulse">
                    <Zap className="w-3 h-3 fill-gray-900" /> Oferta Relâmpago
                  </div>
                )}
                {idx === 0 && (
                  <div className="absolute inset-0 border-4 border-amber-500/20 rounded-[1.5rem] animate-pulse pointer-events-none z-10"></div>
                )}

                <div className="absolute inset-0">
                  <img
                    src={campaign.image}
                    alt={campaign.title}
                    className={`w-full h-full object-cover mix-blend-overlay transition-transform duration-700 opacity-40 group-hover:scale-105`}
                  />
                </div>
                <div className={`relative z-10 p-8 flex flex-col justify-end h-full min-h-[16.25rem]`}>
                  <span className="text-amber-400 font-bold tracking-widest uppercase text-[0.625rem] mb-2 block">Campanha</span>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold mb-3 leading-none">{campaign.title}</h2>
                  <Link
                    to={`/properties?campaignId=${campaign.id}`}
                    className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-white hover:text-gray-900 transition-all w-fit flex items-center gap-2 text-xs mt-3"
                  >
                    Ver Ofertas <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section - Atendimento Exclusivo */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-[37.5rem] h-[37.5rem] bg-brand-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60"></div>

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <span className="text-brand-600 font-bold uppercase tracking-widest text-xs mb-2 block">Canais de Contato</span>
            <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">Atendimento Exclusivo</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Escolha o canal ideal para sua necessidade. Nossa equipe está pronta para oferecer uma experiência ágil e personalizada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Card Comercial */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-brand-900/5 hover:shadow-2xl transition-all duration-300 border border-gray-100 group flex flex-col items-start relative h-full">
              <div className="flex items-center gap-5 mb-8 w-full">
                <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-gray-900 text-2xl">Comercial & Vendas</h3>
                  <span className="inline-block mt-1 bg-green-100 text-green-700 text-[0.625rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Plantão Online
                  </span>
                </div>
              </div>

              <p className="text-gray-500 mb-10 text-lg leading-relaxed flex-1">
                Deseja comprar, alugar ou anunciar um imóvel? Fale agora com nossos especialistas e receba atendimento imediato.
              </p>

              <a
                href={`https://wa.me/${APP_CONFIG.whatsapp}?text=Olá, gostaria de informações sobre imóveis.`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 group-hover:-translate-y-1 duration-300 text-lg"
              >
                <MessageCircle className="fill-white w-5 h-5" /> Chamar no WhatsApp
              </a>
            </div>

            {/* Card Gerente */}
            <div className="bg-gray-900 p-10 rounded-[2.5rem] shadow-2xl transition-all duration-300 group flex flex-col items-start relative h-full overflow-hidden text-white">
              {/* Pattern Overlay */}
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

              <div className="flex items-center gap-5 mb-8 w-full relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/10 text-white flex items-center justify-center backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-2xl">Daniel Villar</h3>
                    <CheckCircle className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                  </div>
                  <span className="inline-block mt-1 text-amber-400 text-[0.625rem] font-bold px-2 py-0.5 rounded border border-amber-400/30 uppercase tracking-wider">
                    Gerente
                  </span>
                </div>
              </div>

              <p className="text-gray-400 mb-10 text-lg leading-relaxed flex-1 relative z-10">
                Canal exclusivo para parcerias estratégicas, investidores, assuntos administrativos e feedbacks diretos à gestão.
              </p>

              <a
                href={`https://wa.me/${APP_CONFIG.whatsapp}?text=Olá Daniel, gostaria de falar com a gerência.`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-white text-gray-900 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-lg flex items-center justify-center gap-2 group-hover:-translate-y-1 duration-300 text-lg relative z-10"
              >
                Conversar no WhatsApp <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
