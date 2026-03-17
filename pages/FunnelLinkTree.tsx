
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MessageCircle, Search, Key, User, ArrowRight, Instagram, Facebook, Linkedin, Star, MapPin, Loader2 } from 'lucide-react';
import { APP_CONFIG } from '../constants';
import { api } from '../services/api';
import { Property } from '../types';

const FunnelLinkTree: React.FC = () => {
    const [backgrounds, setBackgrounds] = useState<string[]>([]);
    const [currentBgIndex, setCurrentBgIndex] = useState(0);
    const [featuredProperty, setFeaturedProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch Data Real
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Pega os slides do Admin para usar de fundo
                const slides = await api.content.getHeroSlides();
                const activeSlides = slides.filter(s => s.active).map(s => s.image);
                if (activeSlides.length > 0) setBackgrounds(activeSlides);
                else setBackgrounds(["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"]);

                // Pega um imóvel destaque real
                const props = await api.properties.getAll();
                const feat = props.find(p => p.featured) || props[0];
                setFeaturedProperty(feat);
            } catch (error) {
                console.error("Erro ao carregar dados do Hub", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Rotação de Background
    useEffect(() => {
        if (backgrounds.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentBgIndex(prev => (prev + 1) % backgrounds.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [backgrounds]);

    const actions = [
        {
            id: 'whatsapp',
            label: 'Falar com Consultor',
            subLabel: 'Atendimento imediato no WhatsApp',
            icon: MessageCircle,
            href: `https://wa.me/${APP_CONFIG.whatsapp}`,
            external: true,
            style: 'bg-green-600 text-white border-green-500 hover:bg-green-700 shadow-xl shadow-green-900/30 ring-1 ring-green-400/50'
        },
        {
            id: 'properties',
            label: 'Buscar Imóveis',
            subLabel: 'Portfólio completo de vendas',
            icon: Search,
            to: '/properties',
            style: 'bg-white/95 backdrop-blur-md text-brand-900 border-white/50 hover:bg-white hover:scale-[1.02]'
        },
        {
            id: 'launches',
            label: 'Lançamentos & Plantas',
            subLabel: 'Oportunidades para investir',
            icon: Star,
            to: '/properties?type=Lançamento',
            style: 'bg-white/95 backdrop-blur-md text-brand-900 border-white/50 hover:bg-white hover:scale-[1.02]'
        },
        {
            id: 'client',
            label: 'Área do Cliente',
            subLabel: 'Acompanhe seus favoritos',
            icon: User,
            to: '/buyer/login',
            style: 'bg-white/95 backdrop-blur-md text-brand-900 border-white/50 hover:bg-white hover:scale-[1.02]'
        },
        {
            id: 'advertise',
            label: 'Anunciar Imóvel',
            subLabel: 'Avaliação gratuita e fotos',
            icon: Key,
            to: '/advertise',
            style: 'bg-white/95 backdrop-blur-md text-brand-900 border-white/50 hover:bg-white hover:scale-[1.02]'
        }
    ];

    if (loading) return <div className="min-h-screen bg-brand-900 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;

    return (
        <div className="min-h-screen relative flex items-center justify-center py-12 px-4 overflow-hidden bg-brand-900 font-sans">

            {/* Dynamic Background Layer */}
            <div className="absolute inset-0 z-0">
                {backgrounds.map((bg, idx) => (
                    <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${idx === currentBgIndex ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <img
                            src={bg}
                            alt="Background"
                            className="w-full h-full object-cover opacity-40 blur-sm scale-105"
                        />
                    </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-b from-brand-900/90 via-brand-900/70 to-gray-900/90"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md animate-slide-up flex flex-col h-full max-h-[90vh]">

                {/* Header / Profile */}
                <div className="text-center mb-8 flex-shrink-0">
                    <div className="relative inline-block mb-4 group cursor-pointer">
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-300 to-brand-400 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-1000"></div>
                        <div className="relative w-24 h-24 bg-brand-950 rounded-full flex items-center justify-center p-1 shadow-2xl border border-white/10">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-serif font-bold text-white mb-1 tracking-wide">{APP_CONFIG.companyName}</h1>
                    <p className="text-brand-200/80 text-xs font-medium uppercase tracking-[0.2em]">Hub de Acesso Rápido</p>
                </div>

                {/* Links Hub */}
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
                    {actions.map((action) => (
                        action.external ? (
                            <a
                                key={action.id}
                                href={action.href}
                                target="_blank"
                                rel="noreferrer"
                                className={`
                                group relative w-full p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 shadow-lg
                                ${action.style}
                            `}
                            >
                                <div className={`
                                p-2.5 rounded-full flex-shrink-0 transition-all
                                ${action.id === 'whatsapp' ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700 group-hover:scale-110'}
                            `}>
                                    <action.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="font-bold text-sm md:text-base">{action.label}</h3>
                                    <p className={`text-xs ${action.id === 'whatsapp' ? 'text-green-50' : 'text-gray-500'}`}>{action.subLabel}</p>
                                </div>
                                <div className={`
                                opacity-70 group-hover:opacity-100 transition-transform transform group-hover:translate-x-1
                                ${action.id === 'whatsapp' ? 'text-white' : 'text-gray-400'}
                            `}>
                                    <ArrowRight className="w-[1.125rem] h-[1.125rem]" />
                                </div>
                            </a>
                        ) : (
                            <Link
                                key={action.id}
                                to={action.to!}
                                className={`
                                group w-full p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 shadow-lg
                                ${action.style}
                            `}
                            >
                                <div className="p-2.5 rounded-full bg-brand-50 text-brand-700 flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <action.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="font-bold text-sm md:text-base">{action.label}</h3>
                                    <p className="text-xs text-gray-500">{action.subLabel}</p>
                                </div>
                                <div className="text-gray-400 opacity-70 group-hover:opacity-100 transition-transform transform group-hover:translate-x-1">
                                    <ArrowRight className="w-[1.125rem] h-[1.125rem]" />
                                </div>
                            </Link>
                        )
                    ))}

                    {/* Featured Mini Card (Live Data) */}
                    {featuredProperty && (
                        <Link to={`/properties/${featuredProperty.id}`} className="mt-6 block bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer group shadow-2xl">
                            <div className="w-16 h-16 rounded-lg overflow-hidden relative flex-shrink-0 border border-white/10">
                                <img src={featuredProperty.images[0]} className="w-full h-full object-cover" alt="Featured" />
                                <div className="absolute inset-0 bg-black/10"></div>
                                <div className="absolute bottom-1 left-1 bg-amber-500 text-[0.5rem] font-bold px-1.5 py-0.5 rounded text-white uppercase shadow-sm">Destaque</div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-bold text-sm truncate">{featuredProperty.title}</h4>
                                <p className="text-gray-300 text-xs truncate flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5" /> {featuredProperty.city}
                                </p>
                                <p className="text-amber-400 font-bold text-xs mt-1">
                                    {featuredProperty.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                        </Link>
                    )}
                </div>

                {/* Footer / Socials */}
                <div className="mt-6 pt-6 border-t border-white/10 text-center flex-shrink-0">
                    <div className="flex justify-center gap-6 mb-6">
                        <a href={APP_CONFIG.social.instagram} className="text-gray-400 hover:text-white hover:scale-125 transition-all"><Instagram className="w-[1.375rem] h-[1.375rem]" /></a>
                        <a href={APP_CONFIG.social.facebook} className="text-gray-400 hover:text-white hover:scale-125 transition-all"><Facebook className="w-[1.375rem] h-[1.375rem]" /></a>
                        <a href={APP_CONFIG.social.linkedin} className="text-gray-400 hover:text-white hover:scale-125 transition-all"><Linkedin className="w-[1.375rem] h-[1.375rem]" /></a>
                    </div>

                    <div className="mb-4">
                        <Link to="/" className="text-[0.625rem] font-bold text-brand-200 hover:text-white transition-colors uppercase tracking-widest border-b border-transparent hover:border-brand-200 pb-0.5">
                            Acessar Site Completo
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FunnelLinkTree;
