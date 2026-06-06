import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Briefcase, Mail, Lock, Send, FileText, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { maskCPF, validateCPF } from '../utils/validators';
import { APP_CONFIG } from '../constants';

type UserRole = 'buyer' | 'agent';

const Register: React.FC = () => {
  const [role, setRole] = useState<UserRole>('buyer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    creci: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'cpf') {
      setFormData(prev => ({ ...prev, [name]: maskCPF(value) }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'buyer') {
      if (!formData.cpf.trim()) {
        setError('O CPF é obrigatório para clientes.');
        return;
      }
      if (!validateCPF(formData.cpf)) {
        setError('O CPF digitado é inválido.');
        return;
      }
    }
    if (role === 'agent' && !formData.creci.trim()) {
      setError('O CRECI é obrigatório para corretores.');
      return;
    }

    setLoading(true);
    try {
      const registrationData = { ...formData, role };
      await api.auth.register(registrationData);
      // Auto-login após registro
      try {
        await api.auth.login(formData.email, formData.password);
        navigate(role === 'agent' ? '/admin' : '/buyer/dashboard');
      } catch {
        navigate('/login?status=registered');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar se cadastrar. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <Building2 className="w-10 h-10 text-brand-600" />
          </Link>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Crie sua Conta</h1>
          <p className="text-gray-500 mt-2">Acesse um mundo de oportunidades imobiliárias.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg mb-6">
            <button onClick={() => setRole('buyer')} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${role === 'buyer' ? 'bg-white text-brand-800 shadow-sm' : 'text-gray-500'}`}>
              <User size={16} /> Sou Cliente
            </button>
            <button onClick={() => setRole('agent')} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${role === 'agent' ? 'bg-white text-brand-800 shadow-sm' : 'text-gray-500'}`}>
              <Briefcase size={16} /> Sou Corretor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Nome Completo" required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none" />
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Seu melhor e-mail" required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none" />
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Crie uma senha" required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none" />

            {role === 'buyer' && (
              <div className="animate-fade-in">
                <input type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="CPF (obrigatório)" required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
            )}

            {role === 'agent' && (
              <div className="animate-fade-in">
                <input type="text" name="creci" value={formData.creci} onChange={handleInputChange} placeholder="CRECI (obrigatório)" required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <span className="shrink-0">⚠</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-brand-900 text-white font-bold py-3 rounded-lg hover:bg-brand-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-900/20 disabled:bg-gray-400">
              {loading ? 'Criando conta...' : <>Criar Conta <Send size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem uma conta? <Link to="/login" className="font-bold text-brand-600 hover:underline">Faça login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
