import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { toCurrentUser, useAuth } from '../../contexts/AuthContext';

const BuyerLogin: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  // Validações em tempo real para registro
  const pwChecks = {
    len:   password.length >= 8,
    upper: /[A-Z]/.test(password),
    num:   /[0-9]/.test(password),
  };
  const pwValid = pwChecks.len && pwChecks.upper && pwChecks.num;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await api.auth.login(email, password);
      setCurrentUser(toCurrentUser(user));
      if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'agent') {
        navigate('/admin');
      } else {
        navigate('/buyer/dashboard');
      }
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('Invalid credentials') || msg.includes('401')) {
        setError('E-mail ou senha incorretos. Verifique e tente novamente.');
      } else if (msg.includes('Network') || msg.includes('fetch')) {
        setError('Sem conexão com o servidor. Verifique se o backend está rodando.');
      } else {
        setError(msg || 'Erro ao entrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || name.trim().length < 2) {
      setError('Nome precisa ter pelo menos 2 caracteres.'); return;
    }
    if (!pwValid) {
      setError('Senha não atende os requisitos mínimos.'); return;
    }
    setLoading(true);
    try {
      await api.auth.register({ name: name.trim(), email, password, role: 'agent' });
      setSuccess('Conta criada! Fazendo login...');
      // Auto-login após registro
      const user = await api.auth.login(email, password);
      setCurrentUser(toCurrentUser(user));
      navigate('/admin');
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('already exists') || msg.includes('400')) {
        setError('Este e-mail já está cadastrado. Faça login.');
      } else if (msg.includes('Email inválido')) {
        setError('Formato de e-mail inválido.');
      } else if (msg.includes('Senha')) {
        setError(msg);
      } else {
        setError(msg || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError('');
    setSuccess('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo — imagem */}
      <div className="hidden lg:block w-1/2 relative bg-gray-900">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
          alt="Luxury"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 flex flex-col justify-between p-16 pb-20 text-white z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white text-brand-900 p-2 rounded-lg"><Building2 size={24} /></div>
            <span className="text-xl font-serif font-bold">Ivillar</span>
          </div>
          <div>
            <h2 className="text-4xl font-serif font-bold mb-4">
              {mode === 'login' ? 'Bem-vindo de volta.' : 'Crie sua conta.'}
            </h2>
            <p className="text-gray-300 text-lg max-w-md">
              {mode === 'login'
                ? 'Acesse sua área para gerenciar leads, imóveis e campanhas.'
                : 'Junte-se à plataforma e comece a gerenciar seus negócios.'}
            </p>
          </div>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full">

          {/* Título */}
          <div className="text-center lg:text-left mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {mode === 'login' ? 'Acesse sua conta' : 'Criar nova conta'}
            </h1>
            <p className="text-gray-500">
              {mode === 'login' ? 'Digite seus dados para continuar' : 'Preencha os dados para se cadastrar'}
            </p>
          </div>

          {/* Toggle login/cadastro */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Entrar
            </button>
            <Link
              to="/register"
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all text-center text-gray-500 hover:text-gray-700"
            >
              Cadastrar
            </Link>
          </div>

          {/* Feedback de erro */}
          {error && (
            <div className="flex items-start gap-2.5 p-4 mb-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Feedback de sucesso */}
          {success && (
            <div className="flex items-center gap-2.5 p-4 mb-5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">

            {/* Nome — apenas no cadastro */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  placeholder="João Silva"
                />
              </div>
            )}

            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Indicadores de força — só no cadastro */}
              {mode === 'register' && password.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[
                    { ok: pwChecks.len,   label: '8+ chars' },
                    { ok: pwChecks.upper, label: 'Maiúscula' },
                    { ok: pwChecks.num,   label: 'Número' },
                  ].map((c, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                        c.ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {c.ok ? '✓' : '○'} {c.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Botão principal */}
            <button
              type="submit"
              disabled={loading || (mode === 'register' && !pwValid)}
              className="w-full bg-brand-900 text-white py-3.5 rounded-xl font-bold hover:bg-brand-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'login' ? 'Entrando...' : 'Criando conta...'}</>
                : mode === 'login'
                  ? <> Entrar na Plataforma <ArrowRight size={18} /></>
                  : <> Criar conta <ArrowRight size={18} /></>
              }
            </button>
          </form>

          {/* Atalhos demo — só no login */}
          {mode === 'login' && (
            <div className="mt-8 pt-6 border-t text-center space-y-2">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Credenciais demo</p>
              <div className="flex gap-2 justify-center text-xs flex-wrap">
                {[
                  { label: 'Admin', email: 'admin@novamorada.com.br' },
                  { label: 'Corretor', email: 'eduardo@novamorada.com.br' },
                  { label: 'Cliente', email: 'cliente@email.com' },
                ].map(d => (
                  <button
                    key={d.label}
                    onClick={() => { setEmail(d.email); setError(''); }}
                    className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerLogin;
