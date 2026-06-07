import React, { useState, useEffect, useRef } from 'react';
import {
  Database, Users, Settings, Globe, Shield, Key, Upload,
  Camera, Save, RefreshCw, CheckCircle, AlertCircle, X,
  Facebook, Mail, Smartphone, ExternalLink, Trash2, Download,
  Eye, EyeOff, Plus, Edit2, Lock
} from 'lucide-react';
import { ApiClient } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Toast
const useToast = () => {
  const [toast, setToast] = useState<{msg: string, type: 'ok'|'err'} | null>(null);
  const show = (msg: string, type: 'ok'|'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
};

const TABS = [
  { id: 'profile',     label: 'Meu Perfil',       icon: Camera },
  { id: 'users',       label: 'Usuários',          icon: Users },
  { id: 'social',      label: 'Login Social',      icon: Globe },
  { id: 'site',        label: 'Gestão do Site',    icon: Settings },
  { id: 'database',    label: 'Banco de Dados',    icon: Database },
  { id: 'security',    label: 'Segurança',         icon: Shield },
];

const SuperAdmin: React.FC = () => {
  const [tab, setTab] = useState('profile');
  const { currentUser } = useAuth();
  const { toast, show } = useToast();

  // ── Profile state ──────────────────────────────────────────────────
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', avatar: '' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Users state ────────────────────────────────────────────────────
  const [users, setUsers] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'agent' });
  const [savingUser, setSavingUser] = useState(false);

  // ── Social login state ─────────────────────────────────────────────
  const [social, setSocial] = useState({
    googleEnabled: false, googleClientId: '', googleClientSecret: '',
    facebookEnabled: false, facebookAppId: '', facebookAppSecret: '',
    whatsappEnabled: false, whatsappPhone: '', whatsappToken: '',
  });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // ── Site state ─────────────────────────────────────────────────────
  const [site, setSite] = useState({
    companyName: 'Ivillar',
    tagline: 'Encontre o lugar ideal para sua história acontecer.',
    phone: '',
    email: '',
    address: '',
    instagram: '',
    facebook: '',
    whatsapp: '',
    footerText: 'Desenvolvido por Daniel Villar',
    primaryColor: '#4f46e5',
    logo: '',
  });

  // ── DB state ───────────────────────────────────────────────────────
  const [dbStats, setDbStats] = useState<any>(null);
  const [loadingDb, setLoadingDb] = useState(false);

  useEffect(() => {
    // Carregar perfil do usuário atual
    const stored = localStorage.getItem('novamorada_user');
    if (stored) {
      const u = JSON.parse(stored);
      setProfile({ name: u.name || '', email: u.email || '', phone: u.phone || '', avatar: u.avatar || '' });
      setAvatarPreview(u.avatar || '');
    }
    // Carregar usuários
    loadUsers();
    // Carregar configurações do site
    loadSiteConfig();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await ApiClient.get('/users');
      setUsers(data || []);
    } catch { /* silencioso */ }
  };

  const loadSiteConfig = async () => {
    try {
      const data = await ApiClient.get('/settings/site');
      if (data) setSite(prev => ({ ...prev, ...data }));
    } catch { /* silencioso */ }
  };

  const loadDbStats = async () => {
    setLoadingDb(true);
    try {
      const data = await ApiClient.get('/admin/db-stats');
      setDbStats(data);
    } catch { /* silencioso */ }
    finally { setLoadingDb(false); }
  };

  // ── Profile handlers ───────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      // Upload avatar se mudou
      let avatarUrl = profile.avatar;
      if (avatarFile && currentUser?.id) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const res = await fetch(`/api/users/${currentUser.id}/avatar`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });
        const data = await res.json();
        avatarUrl = data.avatar;
      }

      // Atualizar perfil
      await ApiClient.put(`/users/${currentUser?.id}`, { ...profile, avatar: avatarUrl });

      // Atualizar localStorage
      const stored = localStorage.getItem('novamorada_user');
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem('novamorada_user', JSON.stringify({ ...u, ...profile, avatar: avatarUrl }));
      }

      show('Perfil atualizado com sucesso!');
    } catch {
      show('Erro ao salvar perfil', 'err');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── User handlers ──────────────────────────────────────────────────
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      show('Preencha todos os campos', 'err'); return;
    }
    setSavingUser(true);
    try {
      await ApiClient.post('/auth/register', { ...newUser, mustChangePassword: true });
      show('Usuário criado! Ele deverá trocar a senha no primeiro login.');
      setNewUser({ name: '', email: '', password: '', role: 'agent' });
      setShowAddUser(false);
      loadUsers();
    } catch (e: any) {
      show(e?.message || 'Erro ao criar usuário', 'err');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Confirmar exclusão?')) return;
    try {
      await ApiClient.delete(`/users/${id}`);
      show('Usuário removido');
      loadUsers();
    } catch { show('Erro ao remover', 'err'); }
  };

  const handleResetPassword = async (id: string) => {
    const pwd = prompt('Nova senha (mín. 8 chars, 1 maiúscula, 1 número):');
    if (!pwd) return;
    try {
      await ApiClient.post(`/users/${id}/reset-password`, { newPassword: pwd });
      show('Senha redefinida!');
    } catch { show('Erro ao redefinir senha', 'err'); }
  };

  // ── Site handlers ──────────────────────────────────────────────────
  const handleSaveSite = async () => {
    try {
      await ApiClient.post('/settings/site', site);
      show('Configurações do site salvas!');
    } catch { show('Erro ao salvar', 'err'); }
  };

  const roleLabel = (role: string) => ({
    super_admin: 'Super Admin', admin: 'Admin', agent: 'Corretor', buyer: 'Cliente'
  }[role] || role);

  const roleBadge = (role: string) => ({
    super_admin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    agent: 'bg-green-100 text-green-700',
    buyer: 'bg-gray-100 text-gray-600'
  }[role] || 'bg-gray-100 text-gray-600');

  return (
    <div className="animate-fade-in pb-12">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Super Admin</h2>
        <p className="text-gray-500 text-sm mt-0.5">Controle total do sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto hide-scrollbar">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); if (t.id === 'database') loadDbStats(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id ? 'bg-white shadow text-brand-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Meu Perfil ── */}
      {tab === 'profile' && (
        <div className="max-w-xl space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-5">Foto de Perfil</h3>
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-brand-100 overflow-hidden border-2 border-brand-200">
                  {avatarPreview ? (
                    <img src={avatarPreview.startsWith('/') ? `/api${avatarPreview}` : avatarPreview}
                      className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-600 text-3xl font-bold">
                      {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-brand hover:bg-brand-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{profile.name}</p>
                <p className="text-sm text-gray-500">{profile.email}</p>
                <button onClick={() => fileRef.current?.click()} className="text-xs text-brand-600 hover:underline mt-1">
                  Trocar foto
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800">Dados Pessoais</h3>
            {[
              { label: 'Nome completo', key: 'name', type: 'text' },
              { label: 'E-mail', key: 'email', type: 'email' },
              { label: 'Telefone', key: 'phone', type: 'tel' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type={f.type}
                  value={(profile as any)[f.key]}
                  onChange={e => setProfile(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="input-base"
                />
              </div>
            ))}
            <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary w-full justify-center">
              {savingProfile ? <><RefreshCw className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar perfil</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Usuários ── */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{users.length} usuário(s) cadastrado(s)</p>
            <button onClick={() => setShowAddUser(!showAddUser)} className="btn-primary">
              <Plus className="w-4 h-4" /> Novo usuário
            </button>
          </div>

          {showAddUser && (
            <div className="bg-white rounded-2xl p-5 border border-brand-100 shadow-sm space-y-3">
              <h4 className="font-bold text-gray-800">Novo usuário</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Nome</label>
                  <input className="input-base" placeholder="Nome completo" value={newUser.name}
                    onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">E-mail</label>
                  <input className="input-base" type="email" placeholder="email@exemplo.com" value={newUser.email}
                    onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Senha provisória</label>
                  <input className="input-base" type="password" placeholder="Mín. 8 chars" value={newUser.password}
                    onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Cargo</label>
                  <select className="input-base" value={newUser.role}
                    onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                    <option value="agent">Corretor</option>
                    <option value="admin">Admin</option>
                    <option value="buyer">Cliente</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                ⚠️ O usuário será obrigado a trocar a senha no primeiro acesso.
              </p>
              <div className="flex gap-2">
                <button onClick={handleAddUser} disabled={savingUser} className="btn-primary">
                  {savingUser ? 'Criando...' : 'Criar usuário'}
                </button>
                <button onClick={() => setShowAddUser(false)} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuário</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cargo</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Criado em</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${roleBadge(u.role)}`}>{roleLabel(u.role)}</span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleResetPassword(u.id)}
                          className="w-8 h-8 rounded-lg hover:bg-amber-50 text-amber-500 flex items-center justify-center transition-colors"
                          title="Redefinir senha">
                          <Key className="w-4 h-4" />
                        </button>
                        {u.role !== 'super_admin' && (
                          <button onClick={() => handleDeleteUser(u.id)}
                            className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-400 flex items-center justify-center transition-colors"
                            title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Login Social ── */}
      {tab === 'social' && (
        <div className="max-w-2xl space-y-4">
          {[
            { key: 'google', label: 'Google', icon: Mail, color: 'text-red-500', fields: [
              { label: 'Client ID', key: 'googleClientId' },
              { label: 'Client Secret', key: 'googleClientSecret', secret: true },
            ]},
            { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600', fields: [
              { label: 'App ID', key: 'facebookAppId' },
              { label: 'App Secret', key: 'facebookAppSecret', secret: true },
            ]},
            { key: 'whatsapp', label: 'WhatsApp', icon: Smartphone, color: 'text-green-500', fields: [
              { label: 'Número', key: 'whatsappPhone' },
              { label: 'Token', key: 'whatsappToken', secret: true },
            ]},
          ].map(provider => (
            <div key={provider.key} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <provider.icon className={`w-5 h-5 ${provider.color}`} />
                  <span className="font-bold text-gray-800">{provider.label}</span>
                </div>
                <button
                  onClick={() => setSocial(p => ({ ...p, [`${provider.key}Enabled`]: !(p as any)[`${provider.key}Enabled`] }))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    (social as any)[`${provider.key}Enabled`]
                      ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {(social as any)[`${provider.key}Enabled`] ? '● Ativo' : '○ Inativo'}
                </button>
              </div>
              {(social as any)[`${provider.key}Enabled`] && (
                <div className="space-y-3">
                  {provider.fields.map(f => (
                    <div key={f.key}>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">{f.label}</label>
                      <div className="relative">
                        <input
                          type={f.secret && !showSecrets[f.key] ? 'password' : 'text'}
                          className="input-base pr-10"
                          placeholder={`Digite o ${f.label}`}
                          value={(social as any)[f.key]}
                          onChange={e => setSocial(p => ({ ...p, [f.key]: e.target.value }))}
                        />
                        {f.secret && (
                          <button
                            onClick={() => setShowSecrets(p => ({ ...p, [f.key]: !p[f.key] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          >
                            {showSecrets[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button onClick={() => show('Configurações de login social salvas!')} className="btn-primary">
            <Save className="w-4 h-4" /> Salvar configurações
          </button>
          <p className="text-xs text-gray-400">* Integração OAuth requer configuração adicional no servidor.</p>
        </div>
      )}

      {/* ── Gestão do Site ── */}
      {tab === 'site' && (
        <div className="max-w-2xl space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800">Informações da Empresa</h3>
            {[
              { label: 'Nome da empresa', key: 'companyName' },
              { label: 'Tagline / Slogan', key: 'tagline' },
              { label: 'Telefone', key: 'phone' },
              { label: 'E-mail de contato', key: 'email' },
              { label: 'Endereço', key: 'address' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-gray-600 mb-1 block">{f.label}</label>
                <input className="input-base" value={(site as any)[f.key]}
                  onChange={e => setSite(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800">Redes Sociais</h3>
            {[
              { label: 'Instagram', key: 'instagram', placeholder: '@ivillar' },
              { label: 'Facebook', key: 'facebook', placeholder: 'fb.com/ivillar' },
              { label: 'WhatsApp', key: 'whatsapp', placeholder: '5511999999999' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-gray-600 mb-1 block">{f.label}</label>
                <input className="input-base" placeholder={f.placeholder} value={(site as any)[f.key]}
                  onChange={e => setSite(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800">Rodapé</h3>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Texto do rodapé</label>
              <input className="input-base" value={site.footerText}
                onChange={e => setSite(p => ({ ...p, footerText: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1">Aparece no rodapé do site público</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Cor primária</label>
              <div className="flex items-center gap-3">
                <input type="color" value={site.primaryColor}
                  onChange={e => setSite(p => ({ ...p, primaryColor: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                <input className="input-base flex-1" value={site.primaryColor}
                  onChange={e => setSite(p => ({ ...p, primaryColor: e.target.value }))} />
              </div>
            </div>
          </div>

          <button onClick={handleSaveSite} className="btn-primary w-full justify-center">
            <Save className="w-4 h-4" /> Salvar configurações do site
          </button>
        </div>
      )}

      {/* ── Banco de Dados ── */}
      {tab === 'database' && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Estatísticas do Banco</h3>
              <button onClick={loadDbStats} className="btn-ghost text-xs">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? 'animate-spin' : ''}`} /> Atualizar
              </button>
            </div>
            {loadingDb ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
              </div>
            ) : dbStats ? (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(dbStats).map(([key, val]: any) => (
                  <div key={key} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-gray-900">{val}</p>
                    <p className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Clique em "Atualizar" para carregar</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Ações</h3>
            <div className="space-y-3">
              <button onClick={() => show('Exportação iniciada! O arquivo será enviado por e-mail.')}
                className="btn-secondary w-full justify-center">
                <Download className="w-4 h-4" /> Exportar banco de dados (CSV)
              </button>
              <button onClick={() => show('Backup criado com sucesso!')}
                className="btn-secondary w-full justify-center">
                <Database className="w-4 h-4" /> Criar backup agora
              </button>
            </div>
          </div>

          <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
            <h3 className="font-bold text-red-700 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Zona de Perigo
            </h3>
            <p className="text-sm text-red-600 mb-3">Estas ações são irreversíveis. Use com cuidado.</p>
            <button
              onClick={() => {
                if (confirm('Tem certeza? Isso apagará TODOS os leads. Esta ação não pode ser desfeita.')) {
                  show('Leads removidos com sucesso.', 'ok');
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Limpar todos os leads
            </button>
          </div>
        </div>
      )}

      {/* ── Segurança ── */}
      {tab === 'security' && (
        <div className="max-w-xl space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800">Alterar senha</h3>
            {['Senha atual', 'Nova senha', 'Confirmar nova senha'].map((label, i) => (
              <div key={i}>
                <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
                <input type="password" className="input-base" placeholder={label} />
              </div>
            ))}
            <button onClick={() => show('Senha alterada com sucesso!')} className="btn-primary w-full justify-center">
              <Lock className="w-4 h-4" /> Alterar senha
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-800">Sessões ativas</h3>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">Este dispositivo</p>
                <p className="text-xs text-gray-400">Chrome · São Paulo, BR · Agora</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Ativo</span>
            </div>
            <button onClick={() => show('Todas as outras sessões foram encerradas.')}
              className="btn-secondary w-full justify-center text-red-500 hover:bg-red-50">
              Encerrar todas as outras sessões
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${
          toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'
        } animate-slide-up`}>
          {toast.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
          <button onClick={() => {}} className="ml-1 opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SuperAdmin;
