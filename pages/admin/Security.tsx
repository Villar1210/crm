import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Users, Activity, Key, Settings,
  Search, X, Eye, EyeOff,
  Lock, Unlock, CheckCircle, AlertCircle, Loader2,
  ToggleLeft, ToggleRight, RefreshCw, QrCode, Copy,
  AlertTriangle, Monitor, Clock, MapPin,
  UserX, Save,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string; name: string; email: string; role: string;
  phone?: string | null; team?: string | null; avatar?: string | null;
  createdAt: string; isActive: boolean; lastLogin?: string | null;
  loginAttempts: number; lockedUntil?: string | null;
  twoFactorEnabled: boolean; mustChangePassword: boolean;
}

interface LoginLog {
  id: string; email: string; ip?: string; userAgent?: string;
  success: boolean; failReason?: string; createdAt: string;
  user?: { name: string; email: string };
}

interface SecuritySettings {
  passwordMinLength: number; requireUppercase: boolean;
  requireNumber: boolean; requireSpecial: boolean;
  sessionExpiryHours: number; maxLoginAttempts: number;
  lockDurationMinutes: number; allowedIPs: string;
}

type Tab = 'users' | 'logs' | '2fa' | 'settings';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL || '/api';

async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
  return data;
}

const ROLES = [
  { value: 'super_admin', label: 'Super Admin', color: 'indigo' },
  { value: 'admin', label: 'Admin', color: 'purple' },
  { value: 'agent', label: 'Corretor', color: 'blue' },
  { value: 'buyer', label: 'Cliente', color: 'green' },
];

function roleBadge(role: string) {
  const r = ROLES.find(x => x.value === role);
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-800',
    purple: 'bg-purple-100 text-purple-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[r?.color ?? 'blue']}`}>
      {r?.label ?? role}
    </span>
  );
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────

const ResetPasswordModal: React.FC<{ userId: string; onClose: () => void }> = ({ userId, onClose }) => {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    setLoading(true);
    try {
      await apiFetch(`/security/users/${userId}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword: pw }),
      });
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-indigo-600" /> Resetar Senha</h3>
        <p className="text-sm text-gray-500 mb-4">O usuário será obrigado a alterar a senha no próximo login.</p>
        <div className="relative mb-4">
          <input
            type={show ? 'text' : 'password'}
            value={pw} onChange={e => setPw(e.target.value)}
            placeholder="Nova senha temporária"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-gray-400">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {err && <p className="text-red-500 text-sm mb-3">{err}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50">Cancelar</button>
          <button onClick={submit} disabled={loading || pw.length < 8} className="btn-primary text-sm px-4 py-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── 2FA Modal ────────────────────────────────────────────────────────────────

const TwoFAModal: React.FC<{ userId: string; userEmail: string; onClose: () => void; onEnabled: () => void }> = ({ userId, userEmail, onClose, onEnabled }) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    setLoading(true);
    apiFetch(`/security/2fa/setup/${userId}`, { method: 'POST' })
      .then(d => { setQrCode(d.qrCode); setSecret(d.secret); })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const verify = async () => {
    setErr('');
    setLoading(true);
    try {
      const d = await apiFetch(`/security/2fa/enable/${userId}`, { method: 'POST', body: JSON.stringify({ token }) });
      setBackupCodes(d.backupCodes);
      setStep('backup');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><QrCode className="w-5 h-5 text-indigo-600" /> Configurar 2FA</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {loading && <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}

        {!loading && step === 'setup' && (
          <>
            <p className="text-sm text-gray-600 mb-4">Escaneie o QR Code com Google Authenticator ou Authy ({userEmail}):</p>
            {qrCode && <img src={qrCode} alt="QR Code" className="mx-auto mb-4 rounded-lg border" />}
            <p className="text-xs text-gray-400 text-center mb-4">Ou insira manualmente: <code className="bg-gray-100 px-1 rounded">{secret}</code></p>
            <button onClick={() => setStep('verify')} className="btn-primary w-full py-2 text-sm">Já escaneei → Verificar</button>
          </>
        )}

        {!loading && step === 'verify' && (
          <>
            <p className="text-sm text-gray-600 mb-4">Digite o código de 6 dígitos do seu app autenticador:</p>
            <input
              value={token} onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000" maxLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            />
            {err && <p className="text-red-500 text-sm mb-3">{err}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep('setup')} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Voltar</button>
              <button onClick={verify} disabled={token.length !== 6 || loading} className="flex-1 btn-primary py-2 text-sm disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Ativar 2FA'}
              </button>
            </div>
          </>
        )}

        {step === 'backup' && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-amber-800 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Guarde estes códigos de emergência!</p>
              <p className="text-xs text-amber-700 mt-1">Cada código só pode ser usado uma vez. Sem eles, você perderá o acesso se perder o celular.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {backupCodes.map((c, i) => (
                <code key={i} className="bg-gray-100 text-center rounded px-2 py-1 text-sm font-mono">{c}</code>
              ))}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(backupCodes.join('\n')); }} className="w-full border rounded-lg py-2 text-sm flex items-center justify-center gap-2 hover:bg-gray-50 mb-3">
              <Copy className="w-4 h-4" /> Copiar códigos
            </button>
            <button onClick={() => { onEnabled(); onClose(); }} className="btn-primary w-full py-2 text-sm">Concluir</button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Tab: Usuários ────────────────────────────────────────────────────────────

const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resetId, setResetId] = useState<string | null>(null);
  const [twoFAUser, setTwoFAUser] = useState<UserRow | null>(null);
  const [toasting, setToasting] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/users');
      setUsers(data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toast = (msg: string) => { setToasting(msg); setTimeout(() => setToasting(''), 3000); };

  const toggleActive = async (u: UserRow) => {
    try {
      await apiFetch(`/security/users/${u.id}/active`, { method: 'PUT', body: JSON.stringify({ isActive: !u.isActive }) });
      toast(u.isActive ? `${u.name} desativado` : `${u.name} ativado`);
      load();
    } catch (e: any) { toast(e.message); }
  };

  const unlock = async (u: UserRow) => {
    try {
      await apiFetch(`/security/users/${u.id}/unlock`, { method: 'POST' });
      toast(`${u.name} desbloqueado`);
      load();
    } catch (e: any) { toast(e.message); }
  };

  const disable2FA = async (u: UserRow) => {
    if (!confirm(`Desativar 2FA de ${u.name}?`)) return;
    try {
      await apiFetch(`/security/2fa/${u.id}`, { method: 'DELETE', body: JSON.stringify({}) });
      toast('2FA desativado');
      load();
    } catch (e: any) { toast(e.message); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const isLocked = (u: UserRow) => u.lockedUntil ? new Date(u.lockedUntil) > new Date() : false;

  return (
    <div>
      {toasting && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in">
          {toasting}
        </div>
      )}
      {resetId && <ResetPasswordModal userId={resetId} onClose={() => { setResetId(null); load(); }} />}
      {twoFAUser && (
        <TwoFAModal
          userId={twoFAUser.id} userEmail={twoFAUser.email}
          onClose={() => setTwoFAUser(null)} onEnabled={() => { toast('2FA ativado com sucesso'); load(); }}
        />
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuário..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <span className="text-sm text-gray-500">{filtered.length} usuário(s)</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Usuário</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Último acesso</th>
                <th className="px-4 py-3 text-left">2FA</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                        {u.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{roleBadge(u.role)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium"><CheckCircle className="w-3 h-3" /> Ativo</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium"><UserX className="w-3 h-3" /> Inativo</span>
                      )}
                      {isLocked(u) && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium"><Lock className="w-3 h-3" /> Bloqueado</span>
                      )}
                      {u.mustChangePassword && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600"><Key className="w-3 h-3" /> Trocar senha</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(u.lastLogin)}</td>
                  <td className="px-4 py-3">
                    {u.twoFactorEnabled ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium bg-green-50 px-2 py-1 rounded-full">
                        <Shield className="w-3 h-3" /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleActive(u)}
                        title={u.isActive ? 'Desativar' : 'Ativar'}
                        className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                      >
                        {u.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      {isLocked(u) && (
                        <button onClick={() => unlock(u)} title="Desbloquear" className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors">
                          <Unlock className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setResetId(u.id)} title="Resetar senha" className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors">
                        <Key className="w-4 h-4" />
                      </button>
                      {u.twoFactorEnabled ? (
                        <button onClick={() => disable2FA(u)} title="Desativar 2FA" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                          <QrCode className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => setTwoFAUser(u)} title="Ativar 2FA" className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Logs de Acesso ──────────────────────────────────────────────────────

const LogsTab: React.FC = () => {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch(`/security/logs?limit=30&page=${page}`);
      setLogs(d.logs);
      setTotal(d.total);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const failReasonLabel: Record<string, string> = {
    user_not_found: 'Usuário não encontrado',
    account_disabled: 'Conta desativada',
    account_locked: 'Conta bloqueada',
    invalid_password: 'Senha incorreta',
    invalid_password_locked: 'Senha incorreta (bloqueado)',
    invalid_2fa: 'Código 2FA inválido',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{total} registro(s) total</p>
        <button onClick={load} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800">
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Data/Hora</th>
                  <th className="px-4 py-3 text-left">Usuário</th>
                  <th className="px-4 py-3 text-left">IP</th>
                  <th className="px-4 py-3 text-left">Dispositivo</th>
                  <th className="px-4 py-3 text-left">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(l => (
                  <tr key={l.id} className={`hover:bg-gray-50 ${!l.success ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(l.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{l.user?.name ?? l.email}</p>
                      <p className="text-xs text-gray-400">{l.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{l.ip ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={l.userAgent}>{l.userAgent ?? '—'}</td>
                    <td className="px-4 py-3">
                      {l.success ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                          <CheckCircle className="w-3 h-3" /> Sucesso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertCircle className="w-3 h-3" /> {failReasonLabel[l.failReason ?? ''] ?? l.failReason ?? 'Falha'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-3">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-sm px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">← Anterior</button>
            <span className="text-sm text-gray-500">Página {page}</span>
            <button disabled={page * 30 >= total} onClick={() => setPage(p => p + 1)} className="text-sm px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Próxima →</button>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Tab: 2FA ─────────────────────────────────────────────────────────────────

const TwoFATab: React.FC = () => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<{ enabled: boolean } | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const doToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const users = await apiFetch('/users');
      const me = users.find((u: UserRow) => u.id === currentUser.id);
      setStatus({ enabled: me?.twoFactorEnabled ?? false });
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [currentUser]);

  useEffect(() => { load(); }, [load]);

  const disable = async () => {
    if (!currentUser) return;
    const code = prompt('Digite seu código TOTP para desativar o 2FA:');
    if (!code) return;
    try {
      await apiFetch(`/security/2fa/${currentUser.id}`, { method: 'DELETE', body: JSON.stringify({ token: code }) });
      doToast('2FA desativado');
      load();
    } catch (e: any) { doToast(e.message); }
  };

  return (
    <div className="max-w-xl">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">{toast}</div>
      )}
      {showSetup && currentUser && (
        <TwoFAModal
          userId={currentUser.id} userEmail={currentUser.email}
          onClose={() => setShowSetup(false)} onEnabled={() => { doToast('2FA ativado!'); load(); }}
        />
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Autenticação em Dois Fatores</h3>
            <p className="text-sm text-gray-500">Proteção adicional para sua conta</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : (
          <>
            <div className={`rounded-xl p-4 mb-4 flex items-center gap-3 ${status?.enabled ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              {status?.enabled ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-medium text-green-800 text-sm">2FA está ativo</p>
                    <p className="text-xs text-green-700">Sua conta está protegida com autenticação TOTP</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800 text-sm">2FA não está configurado</p>
                    <p className="text-xs text-amber-700">Recomendamos ativar para maior segurança</p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <Monitor className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
                <span>Use Google Authenticator, Authy ou qualquer app TOTP compatível</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <Key className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
                <span>Você receberá 8 códigos de emergência para uso offline</span>
              </div>
            </div>

            <div className="mt-6">
              {status?.enabled ? (
                <button onClick={disable} className="w-full py-2.5 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
                  Desativar 2FA
                </button>
              ) : (
                <button onClick={() => setShowSetup(true)} className="btn-primary w-full py-2.5 text-sm">
                  Configurar 2FA agora
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Tab: Configurações de Segurança ─────────────────────────────────────────

const SettingsTab: React.FC = () => {
  const DEFAULT: SecuritySettings = {
    passwordMinLength: 8, requireUppercase: true, requireNumber: true,
    requireSpecial: false, sessionExpiryHours: 8, maxLoginAttempts: 5,
    lockDurationMinutes: 30, allowedIPs: '',
  };
  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch('/security/settings')
      .then(d => setSettings({ ...DEFAULT, ...d }))
      .catch(() => { /* use defaults */ })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch('/security/settings', { method: 'PUT', body: JSON.stringify(settings) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-xl space-y-6">
      {/* Password Policy */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Key className="w-4 h-4 text-indigo-600" /> Política de Senha</h4>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Comprimento mínimo</label>
            <input type="number" min={6} max={32} value={settings.passwordMinLength}
              onChange={e => setSettings(s => ({ ...s, passwordMinLength: Number(e.target.value) }))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {([
            { key: 'requireUppercase', label: 'Exigir letra maiúscula' },
            { key: 'requireNumber', label: 'Exigir número' },
            { key: 'requireSpecial', label: 'Exigir caractere especial (!@#$...)' },
          ] as const).map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">{label}</span>
              <button type="button" onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings[key] ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-5' : ''}`} />
              </button>
            </label>
          ))}
        </div>
      </div>

      {/* Session & Lockout */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-600" /> Sessão e Bloqueio</h4>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Expiração da sessão (horas)</label>
            <input type="number" min={1} max={168} value={settings.sessionExpiryHours}
              onChange={e => setSettings(s => ({ ...s, sessionExpiryHours: Number(e.target.value) }))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Máximo de tentativas de login</label>
            <input type="number" min={3} max={20} value={settings.maxLoginAttempts}
              onChange={e => setSettings(s => ({ ...s, maxLoginAttempts: Number(e.target.value) }))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Duração do bloqueio (minutos)</label>
            <input type="number" min={5} max={1440} value={settings.lockDurationMinutes}
              onChange={e => setSettings(s => ({ ...s, lockDurationMinutes: Number(e.target.value) }))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </div>

      {/* IP Whitelist */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-600" /> Whitelist de IPs</h4>
        <p className="text-xs text-gray-500 mb-3">Deixe vazio para permitir todos os IPs. Separe múltiplos IPs com vírgula.</p>
        <textarea value={settings.allowedIPs} onChange={e => setSettings(s => ({ ...s, allowedIPs: e.target.value }))}
          placeholder="Ex: 192.168.1.1, 10.0.0.0/24"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <button onClick={save} disabled={saving}
        className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Configurações'}
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'logs', label: 'Logs de Acesso', icon: Activity },
  { id: '2fa', label: 'Meu 2FA', icon: Key },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

const Security: React.FC = () => {
  const [tab, setTab] = useState<Tab>('users');
  const { currentUser } = useAuth();

  if (currentUser?.role !== 'super_admin' && currentUser?.role !== 'account_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Acesso restrito a administradores</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Segurança</h1>
            <p className="text-sm text-gray-500">Gestão de usuários, acessos e autenticação</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {tab === 'users' && <UsersTab />}
        {tab === 'logs' && <LogsTab />}
        {tab === '2fa' && <TwoFATab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
};

export default Security;
