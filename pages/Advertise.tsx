import React, { useState } from 'react';
import { CheckCircle, Camera, Shield, TrendingUp, Send, MapPin, Building2, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import { LeadStatus, PropertyType } from '../types';

const Advertise: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        objective: 'Venda' as 'Venda' | 'Aluguel',
        type: 'Apartamento' as string,
        zipCode: '',
        bedrooms: '',
        parking: '',
        area: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Create Lead (Source: Site, Interest: Advertise)
            await api.leads.create({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                status: LeadStatus.NEW,
                interest: `Quero Anunciar: ${formData.type} (${formData.objective})`,
                source: 'site',
                notes: [`Imóvel: ${formData.type}, CEP: ${formData.zipCode}, ${formData.bedrooms} quartos, ${formData.area}m²`],
                tags: ['Proprietário', 'Captação Online'],
                tasks: [] // Initialize empty
            });

            // 2. Create Pending Property (Draft)
            // Note: We are creating a barebones property.
            await api.properties.create({
                title: `${formData.type} em [Bairro não informado]`,
                description: `Proprietário solicitou anúncio pelo site.\nContato: ${formData.name} (${formData.phone})\nObjetivo: ${formData.objective}\nCEP: ${formData.zipCode}\nConfiguração: ${formData.bedrooms} quartos, ${formData.parking} vagas, ${formData.area}m²`,
                businessType: formData.objective === 'Venda' ? 'SALE' : 'RENT',
                price: 0, // To be defined
                type: formData.type as PropertyType,
                bedrooms: Number(formData.bedrooms) || 0,
                bathrooms: 1, // Default
                suites: 0,
                area: Number(formData.area) || 0,
                address: `CEP: ${formData.zipCode}`,
                city: 'A definir',
                state: 'UF',
                images: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], // Placeholder
                featured: false,
                published: false,
                status: 'pending', // Pending Review
                features: []
            });

            setSubmitted(true);
        } catch (error) {
            console.error('Erro ao enviar:', error);
            alert('Ocorreu um erro ao enviar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-lg">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Cadastro Recebido!</h2>
                    <p className="text-gray-500 text-lg mb-8">
                        Nossa equipe recebeu os dados do seu imóvel e criou um cadastro preliminar. Um especialista entrará em contato em breve.
                    </p>
                    <button
                        onClick={() => {
                            setSubmitted(false);
                            setFormData({
                                name: '', phone: '', email: '', objective: 'Venda',
                                type: 'Apartamento', zipCode: '', bedrooms: '', parking: '', area: ''
                            });
                        }}
                        className="text-brand-600 font-bold hover:underline"
                    >
                        Cadastrar outro imóvel
                    </button>
                </div>
            </div>
        );
    }

    /* 
       OPTION 3 (SEPARATE MODULE) REFERENCE:
       If we were using a separate module, we would call something like:
       await api.captations.create({ ...formData });
       And the Admin would have a dedicated "Captação" page.
    */

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Header */}
            <div className="relative bg-brand-900 text-white py-24 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" alt="Background" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-brand-900 via-brand-900/90 to-transparent"></div>

                <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="max-w-2xl">
                        <span className="bg-amber-400 text-brand-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">Área do Proprietário</span>
                        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight">
                            Valorize seu patrimônio. <br />Venda ou alugue com quem entende.
                        </h1>
                        <p className="text-xl text-brand-100 mb-8 max-w-xl font-light">
                            Tecnologia de ponta, fotos profissionais e assessoria jurídica completa. Seu imóvel vendido mais rápido e pelo melhor preço.
                        </p>
                        <div className="flex gap-8 text-sm font-bold text-brand-200">
                            <div className="flex items-center gap-2"><TrendingUp size={18} className="text-amber-400" /> Venda 3x mais rápida</div>
                            <div className="flex items-center gap-2"><Shield size={18} className="text-amber-400" /> Garantia Total</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 -mt-10 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Benefits Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Por que anunciar conosco?</h3>
                            <ul className="space-y-6">
                                <li className="flex gap-4">
                                    <div className="bg-brand-50 p-3 rounded-lg text-brand-600 h-fit"><Camera size={20} /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Fotos Profissionais</h4>
                                        <p className="text-sm text-gray-500 mt-1">Produção de fotos HDR, Tour Virtual 360º e vídeos com drone gratuitos.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="bg-brand-50 p-3 rounded-lg text-brand-600 h-fit"><TrendingUp size={20} /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Marketing Agressivo</h4>
                                        <p className="text-sm text-gray-500 mt-1">Anúncios patrocinados no Google, Instagram e portais imobiliários.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="bg-brand-50 p-3 rounded-lg text-brand-600 h-fit"><Shield size={20} /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Jurídico Especializado</h4>
                                        <p className="text-sm text-gray-500 mt-1">Análise de crédito rigorosa e contratos blindados para sua segurança.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-brand-600 rounded-2xl p-8 shadow-lg text-white text-center">
                            <h3 className="text-2xl font-serif font-bold mb-2">Dúvidas?</h3>
                            <p className="text-brand-100 mb-6">Fale diretamente com nossa equipe de captação.</p>
                            <button className="bg-white text-brand-900 w-full py-3 rounded-xl font-bold hover:bg-brand-50 transition-colors">
                                Chamar no WhatsApp
                            </button>
                        </div>
                    </div>

                    {/* Registration Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-8 py-6 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Building2 className="text-brand-600" /> Dados do Imóvel
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">Preencha as informações preliminares para avaliação.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                                {/* Owner Info */}
                                <section>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Seus Dados</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                                            <input required name="name" value={formData.name} onChange={handleChange} type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="Ex: João Silva" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone / WhatsApp</label>
                                            <input required name="phone" value={formData.phone} onChange={handleChange} type="tel" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="(00) 00000-0000" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                                            <input required name="email" value={formData.email} onChange={handleChange} type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="seu@email.com" />
                                        </div>
                                    </div>
                                </section>

                                <hr className="border-gray-100" />

                                {/* Property Info */}
                                <section>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Sobre o Imóvel</h3>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">Qual o objetivo?</label>
                                        <div className="flex gap-4">
                                            <label className="flex-1 cursor-pointer">
                                                <input type="radio" name="objective" value="Venda" checked={formData.objective === 'Venda'} onChange={handleChange} className="peer sr-only" />
                                                <div className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-gray-200 peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700 text-gray-500 font-bold transition-all hover:bg-gray-50">
                                                    <DollarSign size={18} /> Vender
                                                </div>
                                            </label>
                                            <label className="flex-1 cursor-pointer">
                                                <input type="radio" name="objective" value="Aluguel" checked={formData.objective === 'Aluguel'} onChange={handleChange} className="peer sr-only" />
                                                <div className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-gray-200 peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700 text-gray-500 font-bold transition-all hover:bg-gray-50">
                                                    <TrendingUp size={18} /> Alugar
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Imóvel</label>
                                            <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                                                <option value="Apartamento">Apartamento</option>
                                                <option value="Casa">Casa</option>
                                                <option value="Cobertura">Cobertura</option>
                                                <option value="Terreno">Terreno</option>
                                                <option value="Comercial">Comercial</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                                            <div className="relative">
                                                <input name="zipCode" value={formData.zipCode} onChange={handleChange} type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all pl-10" placeholder="00000-000" />
                                                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Quartos</label>
                                            <input name="bedrooms" value={formData.bedrooms} onChange={handleChange} type="number" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Vagas</label>
                                            <input name="parking" value={formData.parking} onChange={handleChange} type="number" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Área (m²)</label>
                                            <input name="area" value={formData.area} onChange={handleChange} type="number" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="000" />
                                        </div>
                                    </div>
                                </section>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-brand-900 text-white py-4 rounded-xl font-bold hover:bg-brand-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-900/20 text-lg"
                                    >
                                        {loading ? 'Enviando...' : <>Enviar Imóvel para Avaliação <Send size={20} /></>}
                                    </button>
                                    <p className="text-center text-xs text-gray-400 mt-4">
                                        Ao enviar, você concorda com nossa Política de Privacidade. Seus dados estão seguros.
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Advertise;