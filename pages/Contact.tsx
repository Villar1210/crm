import React from 'react';
import { Mail, MapPin, Send, Instagram, Linkedin, Facebook, User, MessageCircle, ArrowRight } from 'lucide-react';
import { APP_CONFIG } from '../constants';

const Contact: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-brand-900 py-20 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 animate-slide-up">Fale Conosco</h1>
          <p className="text-brand-100 max-w-2xl mx-auto text-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Estamos prontos para realizar seu sonho. Agende uma visita ou tire suas dúvidas com nossos especialistas.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* Contact Info */}
          <div className="lg:w-1/3 space-y-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Canais de Atendimento</h2>

              <div className="space-y-6">
                {/* Endereço */}
                <div className="flex items-start gap-4">
                  <div className="bg-brand-50 p-3 rounded-full text-brand-600">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Endereço</h3>
                    <p className="text-gray-600">{APP_CONFIG.address}</p>
                  </div>
                </div>

                {/* WhatsApp Vendas - Minimalist */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-brand-200 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 flex-shrink-0">
                      <MessageCircle size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Comercial & Vendas</h3>
                      <p className="text-sm text-gray-500 mb-4">Informações sobre imóveis e vendas.</p>

                      <a
                        href={`https://wa.me/${APP_CONFIG.whatsapp}?text=Olá, gostaria de informações sobre imóveis.`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-brand-600 font-bold hover:underline"
                      >
                        Falar com Consultor <ArrowRight size={16} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Daniel - Minimalist */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-brand-200 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 flex-shrink-0">
                      <User size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-lg">Daniel Villar</h3>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 font-medium">Diretor</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">Assuntos administrativos e parcerias.</p>

                      <a
                        href={`https://wa.me/${APP_CONFIG.whatsapp}?text=Olá Daniel, gostaria de falar com a diretoria.`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-brand-600 font-bold hover:underline"
                      >
                        Contato Direto <ArrowRight size={16} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4 pt-2">
                  <div className="bg-brand-50 p-3 rounded-full text-brand-600">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">E-mail</h3>
                    <p className="text-gray-600">{APP_CONFIG.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Siga-nos</h2>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-brand-600 hover:text-white transition-all"><Instagram size={20} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-brand-600 hover:text-white transition-all"><Facebook size={20} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-brand-600 hover:text-white transition-all"><Linkedin size={20} /></a>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:w-2/3 bg-gray-50 p-8 md:p-12 rounded-[2rem] shadow-sm animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Envie uma mensagem</h2>
            <p className="text-gray-500 mb-8">Preencha o formulário abaixo e retornaremos em breve.</p>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border-gray-200 border focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" placeholder="Seu nome" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input type="tel" className="w-full px-4 py-3 rounded-xl border-gray-200 border focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" placeholder="(00) 00000-0000" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                <input type="email" className="w-full px-4 py-3 rounded-xl border-gray-200 border focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" placeholder="seu@email.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assunto</label>
                <select className="w-full px-4 py-3 rounded-xl border-gray-200 border focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all bg-white">
                  <option>Interesse em Compra</option>
                  <option>Interesse em Aluguel</option>
                  <option>Falar com Diretoria</option>
                  <option>Parceria</option>
                  <option>Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem</label>
                <textarea rows={4} className="w-full px-4 py-3 rounded-xl border-gray-200 border focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" placeholder="Como podemos ajudar?"></textarea>
              </div>

              <button className="bg-brand-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-800 transition-all flex items-center justify-center gap-2 w-full md:w-auto shadow-lg shadow-brand-900/20">
                Enviar Mensagem <Send size={18} />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;