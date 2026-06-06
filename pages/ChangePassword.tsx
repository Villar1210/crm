import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { ApiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ChangePassword: React.FC = () => {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Se não tem usuário logado, redirecionar para login
  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser, navigate]);

  const checks = {
    len:   password.length >= 8,
    upper: /[A-Z]/.test(password),
    num:   /[0-9]/.test(password),
    match: password === confirm && confirm.length > 0,
  };
  const valid = checks.len && checks.upper && checks.num && checks.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setError('');
    setLoading(true);
    try {
      await ApiClient.post('/auth/change-password', {
        userId: currentUser?.id,
        currentPassword: current,
        newPassword: password
      });

      // Atualizar usuário no localStorage
      const stored = localStorage.getItem('user') || localStorage.getItem('novamorada_user');
      if (stored) {
        const user = JSON.parse(stored);
        user.mustChangePassword = false;
        localStorage.setItem('user', JSON.stringify(user));
      }

      setSuccess(true);
      setTimeout(() => {
        const role = currentUser?.role;
        navigate(role === 'admin' || role === 'super_admin' || role === 'agent' ? '/admin' : '/buyer/dashboard');
      }, 2000);
    } catch (e: any) {
      setError(e?.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-modal p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Senha alterada!</h2>
        <p className="text-gray-500 text-sm">Redirecionando para o painel...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-md">
        {/* Header */}
        <div className="p-8 pb-0">
          <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mb-5">
            <ShieldCheck className="w-7 h-7 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Crie sua senha</h1>
          <p className="text-gray-500 text-sm mt-1">
            Por segurança, defina uma senha pessoal antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Senha atual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Senha atual
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={current}
                onChange={e => { setCurrent(e.target.value); setError(''); }}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
                placeholder="Senha fornecida pelo administrador"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nova senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nova senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
                placeholder="Mínimo 8 caracteres"
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Indicadores */}
            {password.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {[
                  { ok: checks.len,   label: '8+ chars' },
                  { ok: checks.upper, label: 'Maiúscula' },
                  { ok: checks.num,   label: 'Número' },
                ].map((c, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                    c.ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {c.ok ? '✓' : '○'} {c.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Confirmar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirmar nova senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none ${
                  confirm && !checks.match ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Repita a nova senha"
              />
            </div>
            {confirm && !checks.match && (
              <p className="text-xs text-red-500 mt-1">Senhas não coincidem</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !valid}
            className="btn-primary w-full justify-center py-3"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              : <>Salvar e continuar <ArrowRight className="w-4 h-4" /></>
            }
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
