import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { toCurrentUser, useAuth } from '../../contexts/AuthContext';

const BuyerLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await api.auth.login(email, password);
      setCurrentUser(toCurrentUser(user));

      setLoading(false);

      // Redirecionamento baseado no cargo (Role)
      if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'agent') {
        navigate('/admin');
      } else {
        navigate('/buyer/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Falha ao entrar. Verifique suas credenciais.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block w-1/2 relative bg-gray-900">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
          alt="Luxury"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 flex flex-col justify-between p-16 pb-[88px] text-white z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white text-brand-900 p-2 rounded-lg"><Building2 size={24} /></div>
            <span className="text-xl font-serif font-bold">LuxeEstate</span>
          </div>
          <div>
            <h2 className="text-4xl font-serif font-bold mb-4">Bem-vindo de volta.</h2>
            <p className="text-gray-300 text-lg max-w-md">Acesse sua área exclusiva para gerenciar favoritos, ver propostas e agendar visitas.</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full">
          <div className="text-center lg:text-left mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Acesse sua conta</h1>
            <p className="text-gray-500">Digite seus dados para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-900 text-white py-4 rounded-xl font-bold hover:bg-brand-800 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Entrando...' : <>Entrar na Plataforma <ArrowRight size={20} /></>}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            Ainda não tem conta? <a href="#" className="text-brand-600 font-bold hover:underline">Criar cadastro</a>
          </div>
          <div className="mt-8 pt-8 border-t text-center space-y-2">
            <p className="text-xs text-gray-400 font-bold uppercase">Credenciais Demo:</p>
            <div className="flex gap-2 justify-center text-xs">
              <button onClick={() => setEmail('admin@novamorada.com.br')} className="bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">Admin</button>
              <button onClick={() => setEmail('eduardo@novamorada.com.br')} className="bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">Corretor</button>
              <button onClick={() => setEmail('cliente@email.com')} className="bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">Cliente</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerLogin;
