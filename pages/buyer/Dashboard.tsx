import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Calculator, User, LogOut, Home, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { Property } from '../../types';

const BuyerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'favorites' | 'simulation' | 'profile'>('favorites');
  const [favorites, setFavorites] = useState<Property[]>([]);
  
  // Simulation State
  const [propertyValue, setPropertyValue] = useState(500000);
  const [downPayment, setDownPayment] = useState(100000);
  const [termYears, setTermYears] = useState(30);
  const [interestRate, setInterestRate] = useState(9.5);

  useEffect(() => {
    const fetch = async () => {
      // Mock user ID
      const data = await api.user.getFavorites('u2');
      setFavorites(data);
    };
    fetch();
  }, []);

  const calculateMortgage = () => {
    const principal = propertyValue - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = termYears * 12;
    
    if (principal <= 0) return 0;
    
    const mortgage = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
      
    return mortgage;
  };

  const monthlyPayment = calculateMortgage();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r flex flex-col">
        <div className="p-8 border-b">
          <div className="flex items-center gap-4 mb-4">
            <img src="https://i.pravatar.cc/150?u=buyer" alt="User" className="w-12 h-12 rounded-full" />
            <div>
              <h3 className="font-bold text-gray-900">Olá, Cliente</h3>
              <p className="text-xs text-gray-500">Conta Premium</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'favorites' ? 'bg-brand-50 text-brand-600 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Heart size={20} /> Meus Favoritos
          </button>
          <button 
            onClick={() => setActiveTab('simulation')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'simulation' ? 'bg-brand-50 text-brand-600 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Calculator size={20} /> Simulador
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-brand-50 text-brand-600 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <User size={20} /> Meus Dados
          </button>
        </nav>

        <div className="p-4 border-t">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium">
            <LogOut size={20} /> Sair
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        {activeTab === 'favorites' && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Meus Favoritos</h1>
            <p className="text-gray-500 mb-8">Imóveis que você salvou para ver depois.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map(property => (
                <div key={property.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all">
                  <div className="relative h-48">
                    <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-sm">
                      <Heart size={16} className="fill-red-500 text-red-500" />
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 mb-1 truncate">{property.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{property.city}</p>
                    <p className="text-brand-600 font-bold text-lg mb-4">{property.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <Link to={`/properties/${property.id}`} className="block w-full text-center bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                      Ver Detalhes
                    </Link>
                  </div>
                </div>
              ))}
              
              {/* Add New Card Placeholder */}
              <Link to="/properties" className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-all bg-gray-50 hover:bg-white h-[380px]">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <Home size={24} />
                </div>
                <span className="font-medium">Buscar mais imóveis</span>
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="animate-fade-in max-w-4xl">
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Simulador de Financiamento</h1>
            <p className="text-gray-500 mb-8">Faça uma estimativa das parcelas do seu novo imóvel.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Controls */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor do Imóvel</label>
                  <input 
                    type="range" 
                    min="200000" 
                    max="5000000" 
                    step="10000"
                    value={propertyValue}
                    onChange={(e) => setPropertyValue(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="mt-2 text-right font-bold text-brand-900">
                    {propertyValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor da Entrada</label>
                  <input 
                    type="range" 
                    min={propertyValue * 0.1} 
                    max={propertyValue * 0.9} 
                    step="5000"
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="mt-2 text-right font-bold text-brand-900">
                    {downPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prazo (Anos)</label>
                    <select 
                      value={termYears} 
                      onChange={(e) => setTermYears(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 font-medium"
                    >
                      <option value="10">10 anos</option>
                      <option value="20">20 anos</option>
                      <option value="30">30 anos</option>
                      <option value="35">35 anos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Juros (Anual)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 font-medium"
                      />
                      <span className="absolute right-4 top-2 text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Result */}
              <div className="bg-brand-900 text-white p-8 rounded-2xl shadow-xl flex flex-col justify-center items-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <p className="text-brand-200 text-sm uppercase tracking-wider font-bold mb-2">Parcela Estimada</p>
                <h2 className="text-5xl font-serif font-bold mb-6">
                  {monthlyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  <span className="text-lg text-brand-300 font-sans font-normal">/mês</span>
                </h2>
                
                <div className="w-full space-y-3 text-sm text-brand-100 mb-8 border-t border-white/10 pt-6">
                  <div className="flex justify-between">
                    <span>Valor Financiado:</span>
                    <span className="font-bold text-white">{(propertyValue - downPayment).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de Parcelas:</span>
                    <span className="font-bold text-white">{termYears * 12}x</span>
                  </div>
                </div>

                <button className="w-full bg-white text-brand-900 py-3 rounded-xl font-bold hover:bg-brand-50 transition-colors flex items-center justify-center gap-2">
                   Falar com Especialista <ArrowRight size={18} />
                </button>
                
                <p className="text-[10px] text-brand-400 mt-4 max-w-xs leading-tight">
                  *Valores estimados. As taxas podem variar de acordo com o perfil de crédito e instituição bancária. Não inclui seguros e taxas administrativas.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
           <div className="animate-fade-in max-w-2xl">
              <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Meus Dados</h1>
              <p className="text-gray-500 mb-8">Mantenha seu contato atualizado para não perder oportunidades.</p>

              <form className="space-y-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="grid grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                     <input type="text" defaultValue="Cliente Vip" className="w-full px-4 py-2 border rounded-lg bg-gray-50" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Sobrenome</label>
                     <input type="text" defaultValue="da Silva" className="w-full px-4 py-2 border rounded-lg bg-gray-50" />
                   </div>
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                     <input type="email" defaultValue="cliente@email.com" className="w-full px-4 py-2 border rounded-lg bg-gray-50" />
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                     <input type="tel" defaultValue="(11) 99999-9999" className="w-full px-4 py-2 border rounded-lg bg-gray-50" />
                </div>
                
                <div className="pt-4 flex justify-end">
                  <button className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700">Salvar Alterações</button>
                </div>
              </form>
           </div>
        )}
      </main>
    </div>
  );
};

export default BuyerDashboard;