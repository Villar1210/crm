import { useEffect, useMemo, useState } from 'react';
import type { CrmSettings } from '../../types';

type EmbedState = 'idle' | 'loading' | 'error' | 'ok';

function sendRuntimeMessage<T>(message: any): Promise<T> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      resolve({} as T);
      return;
    }
    chrome.runtime.sendMessage(message, resolve);
  });
}

const getCrmBaseUrl = (settings?: CrmSettings) => {
  if (!settings) return '';
  const candidate = settings.appUrl || settings.baseUrl?.replace(/\/api\/?$/, '');
  if (!candidate) return '';
  const [base] = candidate.split('/#');
  return base || '';
};

const buildCrmUrl = (settings: CrmSettings | null, route: string) => {
  const base = getCrmBaseUrl(settings || undefined);
  if (!base) return '';
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  return `${base}/#${normalizedRoute}`;
};

export function FunnelPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<CrmSettings | null>(null);
  const [resolvedCrmUrl, setResolvedCrmUrl] = useState('');
  const [embedState, setEmbedState] = useState<EmbedState>('idle');
  const [embedMessage, setEmbedMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    sendRuntimeMessage<{ settings: CrmSettings }>({ type: 'GET_SETTINGS' })
      .then((response) => {
        if (!active) return;
        setSettings(response?.settings || null);
      })
      .catch(() => {
        if (active) setSettings(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const crmFunnelUrl = useMemo(() => buildCrmUrl(settings, '/admin'), [settings]);

  useEffect(() => {
    setResolvedCrmUrl(crmFunnelUrl);
  }, [crmFunnelUrl]);

  useEffect(() => {
    if (!crmFunnelUrl) {
      setEmbedState('error');
      setEmbedMessage('Configure a URL do CRM nas configuracoes para abrir o funil.');
      return;
    }

    let cancelled = false;
    const [base, routePart] = crmFunnelUrl.split('/#');
    const normalizedRoute = routePart
      ? routePart.startsWith('/')
        ? routePart
        : `/${routePart}`
      : '/admin';

    const ping = async (url: string) => {
      const response = await sendRuntimeMessage<{ ok?: boolean }>({ type: 'PING_APP_URL', url });
      return !!response?.ok;
    };

    const validate = async () => {
      setEmbedState('loading');
      setEmbedMessage(null);
      let ok = await ping(base);
      if (!ok && base.startsWith('https://')) {
        const httpBase = `http://${base.slice('https://'.length)}`;
        ok = await ping(httpBase);
        if (ok && !cancelled) {
          setResolvedCrmUrl(`${httpBase}/#${normalizedRoute}`);
        }
      }
      if (cancelled) return;
      if (ok) {
        setEmbedState('ok');
        return;
      }
      setEmbedState('error');
      setEmbedMessage('Servidor offline. Use "Abrir CRM" para abrir em uma nova aba.');
    };

    validate();

    return () => {
      cancelled = true;
    };
  }, [crmFunnelUrl]);

  const openExternal = () => {
    const target = resolvedCrmUrl || crmFunnelUrl;
    if (!target) return;
    window.open(target, '_blank', 'noopener');
  };

  return (
    <div className="fixed inset-0 z-[999999] pointer-events-auto">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-20 right-6 top-6 bottom-6">
        <div
          className="w-full h-full bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div>
              <h2 className="text-base font-bold text-slate-900">Funil de Vendas</h2>
              <p className="text-[11px] text-slate-500">Indicadores e funil sincronizados com o CRM.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openExternal}
                className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-[10px] font-bold uppercase"
              >
                Abrir CRM
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                aria-label="Fechar"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 18L18 6" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 bg-white">
            {!resolvedCrmUrl ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Configure a URL do CRM nas configuracoes para abrir o funil.
              </div>
            ) : embedState === 'error' ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                {embedMessage || 'Nao foi possivel carregar o funil dentro da extensao.'}
              </div>
            ) : embedState === 'loading' ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Carregando funil...
              </div>
            ) : (
              <iframe title="Funil CRM" src={resolvedCrmUrl} className="w-full h-full border-0" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
