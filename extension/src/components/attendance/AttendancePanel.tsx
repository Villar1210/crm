import { useEffect, useMemo, useState } from 'react';
import { WhatsAppScraper } from '../../content/scraper';

type RangeKey = 'today' | 'week' | 'month';

type AttendanceSummary = {
  range: RangeKey;
  updatedAt: string;
  counts: {
    novos: number;
    retornos: number;
    atendidos: number;
    semResposta: number;
  };
  response: {
    averageSeconds: number;
    targetSeconds: number;
    pctWithinTarget: number;
  };
  firstResponse: {
    averageSeconds: number;
    targetSeconds: number;
    pctWithinTarget: number;
    newLeadCount: number;
  };
  pending: Array<{
    chatId: string;
    name: string;
    phone?: string;
    waitingSeconds: number;
  }>;
};

function sendRuntimeMessage<T>(message: any): Promise<T> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      resolve({} as T);
      return;
    }
    chrome.runtime.sendMessage(message, resolve);
  });
}

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatWaiting = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'agora';
  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
};

export function AttendancePanel() {
  const [range, setRange] = useState<RangeKey>('today');
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const resolveOwner = async () => {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const id = await WhatsAppScraper.getMe();
        if (id) {
          if (!cancelled) setOwnerId(id);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      if (!cancelled) setOwnerId(null);
    };
    resolveOwner();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchSummary = async () => {
    if (!ownerId) return;
    setLoading(true);
    setError('');
    try {
      const response = await sendRuntimeMessage<{ summary?: AttendanceSummary; error?: string }>({
        type: 'FETCH_ATTENDANCE_SUMMARY',
        ownerId,
        range,
      });
      if (response?.error) {
        setError(response.error);
        setSummary(null);
      } else {
        setSummary(response?.summary || null);
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao carregar painel.');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const timer = window.setInterval(fetchSummary, 30000);
    return () => window.clearInterval(timer);
  }, [ownerId, range]);

  const updatedLabel = useMemo(() => {
    if (!summary?.updatedAt) return '';
    try {
      return new Date(summary.updatedAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }, [summary?.updatedAt]);

  const responsePct = summary?.response?.pctWithinTarget ?? 0;
  const firstPct = summary?.firstResponse?.pctWithinTarget ?? 0;

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Painel de Atendimento</h2>
          <p className="text-[11px] text-slate-500">Indicadores em tempo real do WhatsApp.</p>
        </div>
        <button
          onClick={fetchSummary}
          className="px-2.5 py-1 rounded-md border border-slate-200 text-[10px] font-bold uppercase text-slate-600 hover:bg-slate-100"
        >
          Atualizar
        </button>
      </div>

      <div className="px-4 py-3 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
        {(['today', 'week', 'month'] as RangeKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setRange(key)}
            className={`px-3 py-1.5 rounded-full border transition ${
              range === key
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {key === 'today' ? 'Hoje' : key === 'week' ? 'Semana' : 'Mês'}
          </button>
        ))}
      </div>

      {!ownerId ? (
        <div className="flex-1 p-6 text-xs text-slate-500">Carregando identificador do WhatsApp...</div>
      ) : loading ? (
        <div className="flex-1 p-6 text-xs text-slate-400">Carregando painel...</div>
      ) : error ? (
        <div className="flex-1 p-6 text-xs text-rose-500">{error}</div>
      ) : summary ? (
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Resumo do período</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Novos', value: summary.counts.novos, tone: 'text-sky-600' },
              { label: 'Retornos', value: summary.counts.retornos, tone: 'text-cyan-600' },
              { label: 'Atendidos', value: summary.counts.atendidos, tone: 'text-emerald-600' },
              { label: 'Sem resposta', value: summary.counts.semResposta, tone: 'text-rose-600' },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm"
              >
                <p className="text-[10px] font-semibold text-slate-400 uppercase">{card.label}</p>
                <p className={`text-2xl font-bold ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tempo de resposta</div>
            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Média {range === 'today' ? 'hoje' : range === 'week' ? 'na semana' : 'no mês'}:</span>
                <span className="font-bold text-slate-800">{formatDuration(summary.response.averageSeconds)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span>Meta:</span>
                <span>{formatDuration(summary.response.targetSeconds)}</span>
              </div>
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.min(100, responsePct)}%` }}
                />
              </div>
              <div className="mt-2 text-[10px] text-slate-400">{responsePct.toFixed(0)}% na meta</div>
            </div>

            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>1ª msg (novos leads):</span>
                <span className="font-bold text-slate-800">
                  {formatDuration(summary.firstResponse.averageSeconds)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span>{summary.firstResponse.newLeadCount} novos</span>
                <span>{formatDuration(summary.firstResponse.targetSeconds)}</span>
              </div>
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500"
                  style={{ width: `${Math.min(100, firstPct)}%` }}
                />
              </div>
              <div className="mt-2 text-[10px] text-slate-400">{firstPct.toFixed(0)}% na meta</div>
            </div>
          </div>

          <div className="pt-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Aguardando resposta</div>
            <div className="text-[10px] text-slate-400 mt-1">
              Backlog considera a ultima mensagem do cliente sem resposta, independente do periodo.
            </div>
            <div className="mt-2 space-y-2">
              {summary.pending.length === 0 ? (
                <div className="text-[11px] text-slate-400">Nenhuma conversa pendente.</div>
              ) : (
                summary.pending.map((item) => (
                  <div
                    key={item.chatId}
                    className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px]"
                  >
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className="text-slate-400">{formatWaiting(item.waitingSeconds)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 pt-2">Atualizado: {updatedLabel}</div>
        </div>
      ) : (
        <div className="flex-1 p-6 text-xs text-slate-500">Sem dados para exibir.</div>
      )}
    </div>
  );
}
