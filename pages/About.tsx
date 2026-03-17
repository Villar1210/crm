import React from 'react';
import { Award, Users, TrendingUp, Building } from 'lucide-react';
import { APP_CONFIG } from '../constants';

const About: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          alt="Office"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gray-900/70"></div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl animate-slide-up">
          <span className="text-brand-300 font-bold tracking-[0.2em] uppercase text-sm mb-4 block">Nossa História</span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">Construindo legados, <br />realizando sonhos.</h1>
          <p className="text-xl text-gray-300 font-light">Há mais de 15 anos redefinindo o conceito de morar bem no mercado de alto padrão.</p>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-24 bg-white container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 space-y-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Quem Somos</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                A {APP_CONFIG.companyName} nasceu da paixão por arquitetura e do compromisso em oferecer um atendimento de excelência.
                Não vendemos apenas imóveis; fazemos curadoria de estilos de vida.
              </p>
              <p className="text-gray-600 leading-relaxed text-lg mt-4">
                Com uma equipe multidisciplinar e tecnologia de ponta, tornamos a jornada de compra e venda transparente, segura e exclusiva.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-200 transition-colors">
                <Award className="w-10 h-10 text-brand-600 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Excelência</h3>
                <p className="text-sm text-gray-500">Premiada 3x consecutivas como melhor imobiliária boutique.</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-200 transition-colors">
                <Users className="w-10 h-10 text-brand-600 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Foco no Cliente</h3>
                <p className="text-sm text-gray-500">Atendimento personalizado e disponibilidade total.</p>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2 relative animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="absolute -inset-4 bg-brand-100 rounded-[2rem] transform rotate-3"></div>
            <img
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
              alt="Meeting"
              className="relative rounded-[2rem] shadow-2xl w-full object-cover h-[31.25rem]"
            />
          </div>
        </div>
      </div>

      {/* Stats - Reused Design Language but different context */}
      <div className="bg-brand-900 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif font-bold mb-12">Números que orgulham</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="p-4">
              <Building className="w-10 h-10 mx-auto mb-4 text-brand-400" />
              <div className="text-4xl font-bold mb-2">2.500+</div>
              <div className="text-brand-200 text-sm uppercase tracking-wider">Imóveis Vendidos</div>
            </div>
            <div className="p-4">
              <Users className="w-10 h-10 mx-auto mb-4 text-brand-400" />
              <div className="text-4xl font-bold mb-2">12.000+</div>
              <div className="text-brand-200 text-sm uppercase tracking-wider">Clientes Atendidos</div>
            </div>
            <div className="p-4">
              <TrendingUp className="w-10 h-10 mx-auto mb-4 text-brand-400" />
              <div className="text-4xl font-bold mb-2">R$ 1.2bi</div>
              <div className="text-brand-200 text-sm uppercase tracking-wider">Em Negócios</div>
            </div>
            <div className="p-4">
              <Award className="w-10 h-10 mx-auto mb-4 text-brand-400" />
              <div className="text-4xl font-bold mb-2">15</div>
              <div className="text-brand-200 text-sm uppercase tracking-wider">Anos de História</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;