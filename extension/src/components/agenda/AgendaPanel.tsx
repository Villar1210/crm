import { useEffect, useMemo, useRef, useState } from 'react';
import type { CrmSettings } from '../../types';
import { WhatsAppScraper } from '../../content/scraper';

type ViewMode = 'sync' | 'external';

type TaskType = 'visit' | 'meeting' | 'call';

type Task = {
  id: string;
  title: string;
  dueDate: string;
  type: string;
  notes?: string;
  completed: boolean;
  leadId?: string;
  lead?: { name?: string; phone?: string };
  userId?: string;
  user?: { name?: string; avatar?: string };
};

type Lead = {
  id: string;
  name?: string;
  phone?: string;
};

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'visit', label: 'Visita' },
  { value: 'meeting', label: 'Reuniao' },
  { value: 'call', label: 'Ligacao' },
];

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

const toDateInputValue = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
};

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const formatDateKey = (value: Date) => value.toISOString().split('T')[0];

export function AgendaPanel() {
  const [settings, setSettings] = useState<CrmSettings | null>(null);
  const [mode, setMode] = useState<ViewMode>('sync');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState<'all' | TaskType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    date: toDateInputValue(new Date()),
    time: '09:00',
    type: 'visit' as TaskType,
    notes: '',
    leadId: ''
  });
  const [leadSearch, setLeadSearch] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showConfig, setShowConfig] = useState(false);
  const [appUrlInput, setAppUrlInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [configMessage, setConfigMessage] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const inFlightRef = useRef(false);
  const timerRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (!settings) return;
    if (settings.appUrl) {
      setAppUrlInput(settings.appUrl);
    }
    if (settings.baseUrl) {
      setBaseUrlInput(settings.baseUrl);
    }
  }, [settings]);

  useEffect(() => {
    let cancelled = false;
    const resolveOwnerId = async () => {
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
    resolveOwnerId();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  }, [currentDate]);

  const agendaUrl = useMemo(() => buildCrmUrl(settings, '/admin/calendar'), [settings]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      if (task.completed) return;
      if (filterType !== 'all' && task.type !== filterType) return;
      const key = String(task.dueDate).split('T')[0];
      const list = map.get(key) || [];
      list.push(task);
      map.set(key, list);
    });
    return map;
  }, [tasks, filterType]);

  const fetchTasks = async (silent = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (!silent) {
      setLoading(true);
    }
    setSyncState('syncing');
    setErrorMessage(null);

    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

    try {
      const response = await sendRuntimeMessage<{ tasks?: Task[]; error?: string }>({
        type: 'FETCH_TASKS',
        params: {
          start: start.toISOString(),
          end: end.toISOString(),
          ...(filterType !== 'all' ? { type: filterType } : {})
        }
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      setTasks(Array.isArray(response?.tasks) ? response.tasks : []);
      setLastSyncAt(Date.now());
      setSyncState('idle');
    } catch (error: any) {
      setSyncState('error');
      setErrorMessage(error?.message || 'Falha ao sincronizar agenda.');
    } finally {
      if (!silent) setLoading(false);
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (mode !== 'sync') return;
    fetchTasks();
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    timerRef.current = window.setInterval(() => fetchTasks(true), 30000);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mode, currentDate, filterType]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (leadSearch.length < 3) {
        setLeads([]);
        return;
      }
      if (!ownerId) return;
      setSearchLoading(true);
      try {
        const response = await sendRuntimeMessage<{ leads?: Lead[]; error?: string }>({
          type: 'FETCH_LEADS',
          query: leadSearch,
          ownerId
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        const result = Array.isArray(response?.leads) ? response.leads : [];
        setLeads(result.slice(0, 6));
      } catch {
        setLeads([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [leadSearch, ownerId]);

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    const dueDate = new Date(`${newTask.date}T${newTask.time}:00`);

    try {
      const response = await sendRuntimeMessage<{ task?: Task; error?: string }>({
        type: 'CREATE_TASK',
        payload: {
          title: newTask.title,
          dueDate: dueDate.toISOString(),
          type: newTask.type,
          notes: newTask.notes,
          leadId: newTask.leadId || undefined
        }
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      setIsModalOpen(false);
      setLeadSearch('');
      setLeads([]);
      setNewTask({
        title: '',
        date: toDateInputValue(selectedDate),
        time: '09:00',
        type: 'visit',
        notes: '',
        leadId: ''
      });
      await fetchTasks();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Nao foi possivel criar o agendamento.');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    setErrorMessage(null);
    try {
      const response = await sendRuntimeMessage<{ error?: string }>({
        type: 'UPDATE_TASK',
        id: taskId,
        payload: { completed: true }
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      await fetchTasks(true);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Nao foi possivel concluir o agendamento.');
    }
  };

  const handleSaveConfig = async () => {
    const trimmedAppUrl = appUrlInput.trim().replace(/\/$/, '');
    const trimmedBaseUrl = baseUrlInput.trim().replace(/\/$/, '');

    if (!trimmedAppUrl && !trimmedBaseUrl) {
      setConfigMessage('Informe pelo menos uma URL.');
      return;
    }

    setSavingConfig(true);
    setConfigMessage(null);

    const updated: CrmSettings = {
      ...(settings || { baseUrl: '' }),
      baseUrl: trimmedBaseUrl || (settings?.baseUrl || ''),
      appUrl: trimmedAppUrl || (settings?.appUrl || '')
    };

    try {
      await sendRuntimeMessage({ type: 'SET_SETTINGS', settings: updated });
      setSettings(updated);
      setConfigMessage('URLs salvas.');
      setShowConfig(false);
    } catch {
      setConfigMessage('Falha ao salvar as URLs.');
    } finally {
      setSavingConfig(false);
    }
  };

  const openExternal = () => {
    if (!agendaUrl) return;
    window.open(agendaUrl, '_blank', 'noopener');
  };

  const openNewTask = (date: Date) => {
    setSelectedDate(date);
    setNewTask((prev) => ({
      ...prev,
      date: toDateInputValue(date)
    }));
    setIsModalOpen(true);
  };

  const selectedTasks = tasksByDay.get(formatDateKey(selectedDate)) || [];

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells: any[] = [];

    for (let i = 0; i < firstDay; i += 1) {
      cells.push(<div key={`empty-${i}`} className="h-12 border border-slate-100 bg-slate-50" />);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const key = formatDateKey(date);
      const isToday = key === formatDateKey(new Date());
      const isSelected = key === formatDateKey(selectedDate);
      const dayTasks = tasksByDay.get(key) || [];

      cells.push(
        <button
          key={key}
          onClick={() => setSelectedDate(date)}
          className={`h-12 border border-slate-100 text-left px-2 py-1 text-[10px] transition ${
            isSelected
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`font-bold ${isToday ? 'text-emerald-500' : ''}`}>{day}</span>
            {dayTasks.length > 0 ? (
              <span className={`text-[9px] font-bold px-1.5 rounded-full ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {dayTasks.length}
              </span>
            ) : null}
          </div>
        </button>
      );
    }

    return cells;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Central de Agendamento</h2>
          <p className="text-[11px] text-slate-500">Agenda sincronizada com o CRM.</p>
          {syncState === 'error' ? (
            <p className="text-[10px] text-rose-500 mt-1">{errorMessage || 'Erro ao sincronizar.'}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig((prev) => !prev)}
            className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            Configurar
          </button>
          <button
            onClick={() => setMode('sync')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border transition ${
              mode === 'sync'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Sincronizado
          </button>
          <button
            onClick={() => setMode('external')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border transition ${
              mode === 'external'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Nova Aba
          </button>
        </div>
      </div>

      {showConfig ? (
        <div className="px-4 py-3 border-b border-slate-100 bg-white flex flex-col gap-2">
          <label className="text-[10px] text-slate-500">URL da API do CRM</label>
          <input
            value={baseUrlInput}
            onChange={(event) => setBaseUrlInput(event.target.value)}
            placeholder="http://localhost:3001/api"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
          />
          <label className="text-[10px] text-slate-500">URL do CRM (front)</label>
          <input
            value={appUrlInput}
            onChange={(event) => setAppUrlInput(event.target.value)}
            placeholder="http://localhost:5173"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold disabled:opacity-60"
            >
              {savingConfig ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          {configMessage ? <p className="text-[10px] text-slate-500">{configMessage}</p> : null}
        </div>
      ) : null}

      {mode === 'external' ? (
        <div className="flex-1 p-6 flex flex-col gap-3 text-xs text-slate-500">
          {!agendaUrl ? (
            <p>Configure a URL do CRM para abrir a agenda em nova aba.</p>
          ) : (
            <>
              <p>Use este botao para abrir a agenda completa no CRM.</p>
              <button
                onClick={openExternal}
                className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold"
              >
                Abrir Agenda no CRM
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-white text-[10px] text-slate-500">
            <div className="flex items-center gap-3">
              <span>Status: {syncState === 'syncing' ? 'Sincronizando' : syncState === 'error' ? 'Erro' : 'OK'}</span>
              {lastSyncAt ? <span>Ultima sync: {new Date(lastSyncAt).toLocaleTimeString()}</span> : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchTasks()}
                className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-[10px] font-bold uppercase"
              >
                Atualizar
              </button>
              <button
                onClick={() => openNewTask(selectedDate)}
                className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 text-[10px] font-bold uppercase"
              >
                Novo
              </button>
            </div>
          </div>

          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-white">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="text-xs font-bold text-slate-500"
            >
              {'<'}
            </button>
            <h3 className="text-xs font-bold text-slate-700">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="text-xs font-bold text-slate-500"
            >
              {'>'}
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-[9px] uppercase text-slate-400">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => (
              <div key={day} className="py-1 text-center font-bold">
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Carregando agenda...
            </div>
          ) : (
            <div className="grid grid-cols-7 auto-rows-[48px] border-b border-slate-100">
              {renderCalendarGrid()}
            </div>
          )}

          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-[10px] bg-white">
            <span className="font-bold text-slate-600">
              {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </span>
            <div className="flex items-center gap-2">
              {TASK_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`px-2 py-1 rounded-full border text-[9px] font-bold ${
                    filterType === type.value
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  {type.label}
                </button>
              ))}
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-1 rounded-full border text-[9px] font-bold ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                Tudo
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedTasks.length === 0 ? (
              <div className="text-xs text-slate-400">Nenhum compromisso para este dia.</div>
            ) : (
              selectedTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-bold uppercase">{task.type}</span>
                    <span>
                      {new Date(task.dueDate).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800">{task.title}</div>
                  {task.lead?.name || task.lead?.phone ? (
                    <div className="text-[10px] text-slate-500">
                      {task.lead?.name || 'Lead'} {task.lead?.phone ? `- ${task.lead.phone}` : ''}
                    </div>
                  ) : null}
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="self-start px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700"
                  >
                    Concluir
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Novo Agendamento</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 text-lg leading-none"
              >
                x
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Titulo</label>
                <input
                  required
                  value={newTask.title}
                  onChange={(event) => setNewTask({ ...newTask, title: event.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={newTask.date}
                    onChange={(event) => setNewTask({ ...newTask, date: event.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    value={newTask.time}
                    onChange={(event) => setNewTask({ ...newTask, time: event.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Tipo</label>
                <div className="flex gap-2">
                  {TASK_TYPES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNewTask({ ...newTask, type: option.value })}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg border ${
                        newTask.type === option.value
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Vincular Lead</label>
                <input
                  value={leadSearch}
                  onChange={(event) => setLeadSearch(event.target.value)}
                  placeholder={ownerId ? 'Buscar lead...' : 'Abra o WhatsApp para carregar leads'}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
                {searchLoading ? (
                  <p className="text-[10px] text-slate-400 mt-1">Buscando...</p>
                ) : null}
                {leadSearch && leads.length > 0 ? (
                  <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
                    {leads.map((lead) => (
                      <button
                        type="button"
                        key={lead.id}
                        onClick={() => {
                          setNewTask({ ...newTask, leadId: lead.id });
                          setLeadSearch(lead.name || lead.phone || 'Lead');
                          setLeads([]);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between"
                      >
                        <span className="font-bold text-slate-700">{lead.name || 'Sem nome'}</span>
                        <span className="text-[10px] text-slate-400">{lead.phone}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Notas</label>
                <textarea
                  value={newTask.notes}
                  onChange={(event) => setNewTask({ ...newTask, notes: event.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs h-16"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-lg"
              >
                Agendar
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
