import React, { useState, useEffect } from 'react';
import {
  Users, Key, Settings, Shield, Plus, Trash2, Edit3,
  Eye, EyeOff, Save, RefreshCw, AlertTriangle, CheckCircle,
  UserPlus, Lock, Unlock, Database, Server, Activity,
  ChevronDown, X, Search, Crown, UserCheck, UserX
} from 'lucide-react';
import { ApiClient } from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

type Tab = 'users' | 'security' | 'system';

// ─── Toast helper ─────────────────────────────────────────────────────────────
const useToast = () => {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'ok' | 'err' }[]>([]);
  const add = (msg: string, type: 'ok' | 'err' = 'ok') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  return { toasts, ok: (m: string) => add(m, 'ok'), err: (m: string) => add(m, 'err') };
};

// ─── Subcomponents ────────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const styles: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700 border border-purple-200',
    admin:       'bg-blue-100 text-blue-700 border border-blue-200',
    agent:       'bg-gray-100 text-gray-600 border border-gray-200',
    buyer:       'bg-green-100 text-green-700 border border-green-200',
  };
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin:       'Admin',
    agent:       'Agente',
    buyer:       'Comprador',
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[role] || styles.agent}`}>
      {labels[role] || role}
    </span>
  );
};

// ─── Reset Password Modal ─────────────────────────────────────────────────────
const ResetPasswordModal: React.FC<{
  user: UserRow;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ user, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const valid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);

  const handleSubmit = async () => {
    if (!valid) { setError('Senha precisa de 8+ chars, 1 maiúscula e 1 número'); return; }
    if (password !== confirm) { setError('Senhas não coincidem'); return; }
    setLoading(true);
    try {
      await ApiClient.post(`/users/${user.id}/reset-password`, { newPassword: password });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Redefinir senha</h3>
              <p className="text-sm text-gray-500">{user.name} · {user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nova senha</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              {[password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password)].map((ok, i) => (
                <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {['8+ chars', 'Maiúscula', 'Número'][i]}
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar senha</label>
            <input
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(''); }}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm ${
                confirm && confirm !== password ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Repita a senha"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !valid || password !== confirm}
            className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Redefinir senha
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Create User Modal ─────────────────────────────────────────────────────────
const CreateUserModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Preencha todos os campos'); return;
    }
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError('Senha: 8+ chars, 1 maiúscula e 1 número'); return;
    }
    setLoading(true);
    try {
      await ApiClient.post('/users', form);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">Novo usuário</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {[
            { label: 'Nome completo', key: 'name', type: 'text', ph: 'João Silva' },
            { label: 'Email', key: 'email', type: 'email', ph: 'joao@empresa.com' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
              <input
                type={f.type}
                value={(form as any)[f.key]}
                onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setError(''); }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                placeholder={f.ph}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha inicial</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={form.password}
                onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setError(''); }}
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                placeholder="Mínimo 8 caracteres"
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Perfil de acesso</label>
            <select
              value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white"
            >
              <option value="agent">Agente</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
              <option value="buyer">Comprador</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Criar usuário
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const AdminConfig: React.FC = () => {
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { toasts, ok, err } = useToast();

  // Current logged user
  const me = (() => {
    try {
      const s = localStorage.getItem('user') || localStorage.getItem('novamorada_user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  })();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<UserRow[]>('/users');
      setUsers(data);
    } catch {
      err('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id: string) => {
    if (id === me?.id) { err('Você não pode excluir sua própria conta'); return; }
    try {
      await ApiClient.delete(`/users/${id}`);
      setUsers(p => p.filter(u => u.id !== id));
      ok('Usuário removido');
    } catch {
      err('Erro ao remover usuário');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleRoleChange = async (user: UserRow, newRole: string) => {
    try {
      await ApiClient.put(`/users/${user.id}`, { role: newRole });
      setUsers(p => p.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      ok(`Perfil de ${user.name} alterado para ${newRole}`);
    } catch {
      err('Erro ao alterar perfil');
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: React.FC<any> }[] = [
    { id: 'users',    label: 'Usuários',     icon: Users },
    { id: 'security', label: 'Segurança',    icon: Shield },
    { id: 'system',   label: 'Sistema',      icon: Server },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações de Admin</h1>
        <p className="text-gray-500 mt-1">Gerencie usuários, senhas e configurações do sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: USERS ── */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar usuário..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Novo usuário
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">Usuário</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">Perfil</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide hidden md:table-cell">Criado em</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(user => (
                    <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${user.id === me?.id ? 'bg-blue-50/40' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                              {user.id === me?.id && (
                                <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">você</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={e => handleRoleChange(user, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:ring-1 focus:ring-brand-500 outline-none"
                        >
                          <option value="agent">Agente</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                          <option value="buyer">Comprador</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setResetTarget(user)}
                            title="Redefinir senha"
                            className="p-1.5 hover:bg-amber-100 hover:text-amber-600 rounded-lg text-gray-400 transition-colors"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          {user.id !== me?.id && (
                            deleteConfirm === user.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(user.id)}
                                title="Remover usuário"
                                className="p-1.5 hover:bg-red-100 hover:text-red-600 rounded-lg text-gray-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="text-xs text-gray-400 text-right">{users.length} usuário(s) cadastrado(s)</p>
        </div>
      )}

      {/* ── TAB: SECURITY ── */}
      {tab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Key className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Recuperação de acesso</h3>
                <p className="text-sm text-gray-500">Redefina a senha de qualquer usuário diretamente</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Para redefinir a senha de um usuário, vá até a aba <strong>Usuários</strong> e clique no ícone de chave (<Key className="inline w-3 h-3" />) na linha do usuário desejado.</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Política de senhas</h3>
                <p className="text-sm text-gray-500">Requisitos aplicados em todo o sistema</p>
              </div>
            </div>
            <ul className="space-y-2">
              {[
                { ok: true, label: 'Mínimo 8 caracteres' },
                { ok: true, label: 'Pelo menos 1 letra maiúscula' },
                { ok: true, label: 'Pelo menos 1 número' },
                { ok: false, label: 'Caractere especial (não obrigatório ainda)' },
                { ok: false, label: 'Autenticação de dois fatores (em breve)' },
              ].map((r, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${r.ok ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {r.ok ? <CheckCircle className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  </span>
                  <span className={r.ok ? 'text-gray-700' : 'text-gray-400'}>{r.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Sessões e tokens</h3>
                <p className="text-sm text-gray-500">JWT expira em 8 horas · Armazenado em localStorage</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-xs font-mono text-gray-600 space-y-1">
              <p>Token: JWT · expiresIn: 8h</p>
              <p>Storage: localStorage["token"]</p>
              <p>User: localStorage["user"] | localStorage["novamorada_user"]</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: SYSTEM ── */}
      {tab === 'system' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Banco de dados</h3>
                <p className="text-sm text-gray-500">SQLite · Prisma ORM · server/prisma/dev.db</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Provider', value: 'SQLite' },
                { label: 'ORM', value: 'Prisma' },
                { label: 'Migrations', value: '2 aplicadas' },
                { label: 'Arquivo', value: 'dev.db' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Server className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Configuração da API</h3>
                <p className="text-sm text-gray-500">Endpoints e variáveis de ambiente</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Local (dev)', value: 'http://localhost:3001/api' },
                { label: 'Produção',   value: 'https://ivillar.com.br/api' },
                { label: 'Variável',   value: 'VITE_API_URL' },
                { label: 'JWT Secret', value: 'JWT_SECRET (env)' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-500">{row.label}</span>
                  <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">{row.value}</code>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-red-800">Zona de perigo</h3>
            </div>
            <p className="text-sm text-red-700 mb-4">
              Operações irreversíveis. Use somente em desenvolvimento ou com backup confirmado.
            </p>
            <button
              onClick={() => {
                const pw = prompt('Digite a senha de admin para confirmar o reset:');
                if (!pw) return;
                ApiClient.post('/system/reset-database', { password: pw, type: 'development' })
                  .then(() => ok('Banco resetado com sucesso'))
                  .catch((e: any) => err(e.message || 'Erro ao resetar banco'));
              }}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Resetar banco (dev)
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onSuccess={() => { ok(`Senha de ${resetTarget.name} redefinida com sucesso`); fetchUsers(); }}
        />
      )}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { ok('Usuário criado com sucesso'); fetchUsers(); }}
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto animate-fade-in ${
              t.type === 'ok'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {t.type === 'ok'
              ? <CheckCircle className="w-4 h-4 shrink-0" />
              : <AlertTriangle className="w-4 h-4 shrink-0" />
            }
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminConfig;
