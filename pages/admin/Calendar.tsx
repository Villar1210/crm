
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, User, Phone, Video, CheckCircle, Plus, X, Search, Loader } from 'lucide-react';
import { api } from '../../services/api';
import { Lead } from '../../types';

// Helper to get days in a month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Helper to get day of week for the first day
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

interface Task {
  id: string;
  title: string;
  dueDate: string; // ISO String
  type: string;
  notes?: string;
  completed: boolean;
  leadId?: string;
  lead?: { name: string };
  userId?: string;
}

const AdminCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<'all' | 'visit' | 'meeting' | 'call'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [newTask, setNewTask] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'visit',
    notes: '',
    leadId: ''
  });
  const [leadSearch, setLeadSearch] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Fetch for the current month view +/- some buffer or just all active tasks
      // For simplicity fetching all for now, optimizing later
      const data = await api.tasks.list();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    // Debounce lead search
    const timer = setTimeout(async () => {
      if (leadSearch.length > 2) {
        setSearchLoading(true);
        try {
          const results = await api.leads.getAll(); // Ideally use a search endpoint
          const filtered = results.filter(l =>
            l.name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
            l.phone?.includes(leadSearch)
          );
          setLeads(filtered.slice(0, 5));
        } finally {
          setSearchLoading(false);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [leadSearch]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dateTime = new Date(`${newTask.date}T${newTask.time}:00`);
      await api.tasks.create({
        title: newTask.title,
        dueDate: dateTime.toISOString(),
        type: newTask.type,
        notes: newTask.notes,
        leadId: newTask.leadId || undefined
      });
      setIsModalOpen(false);
      fetchTasks();
      // Reset form
      setNewTask({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        type: 'visit',
        notes: '',
        leadId: ''
      });
    } catch (error) {
      alert('Erro ao criar agendamento');
    }
  };

  const handleCompleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.tasks.update(id, { completed: true });
      fetchTasks();
    } catch (error) {
      console.error('Failed to complete task', error);
    }
  };

  // Filter tasks based on current view
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (task.completed) return false; // Hide completed in main view? Or differ style
      if (filterType !== 'all' && task.type !== filterType) return false;
      return task.dueDate.split('T')[0] === dateStr;
    });
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/50 border border-gray-100"></div>);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isSelected = dateStr === selectedDate.toISOString().split('T')[0];
      const dayTasks = getTasksForDate(date);

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-24 border border-gray-100 p-2 cursor-pointer transition-all relative group ${isSelected ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-200' : 'hover:bg-gray-50 bg-white'
            }`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-brand-600 text-white' : 'text-gray-700'}`}>
              {day}
            </span>
            {dayTasks.length > 0 && (
              <span className="text-[0.625rem] font-bold bg-gray-100 text-gray-600 px-1.5 rounded-full">
                {dayTasks.length}
              </span>
            )}
            {/* Add Button on Hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDate(date);
                setNewTask(prev => ({ ...prev, date: dateStr }));
                setIsModalOpen(true);
              }}
              className="hidden group-hover:flex items-center justify-center w-5 h-5 bg-brand-100 text-brand-600 rounded hover:bg-brand-200"
            >
              <Plus size={12} />
            </button>
          </div>

          <div className="mt-2 space-y-1">
            {dayTasks.slice(0, 2).map((task, idx) => (
              <div key={idx} className={`text-[0.625rem] truncate px-1.5 py-0.5 rounded border ${task.type === 'visit' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                task.type === 'meeting' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                  'bg-gray-50 text-gray-600 border-gray-100'
                }`}>
                {task.type === 'visit' && '📍 '}
                {task.type === 'call' && '📞 '}
                {task.title}
              </div>
            ))}
            {dayTasks.length > 2 && (
              <div className="text-[0.5625rem] text-gray-400 text-center">+ {dayTasks.length - 2} mais</div>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  const selectedDayTasks = getTasksForDate(selectedDate);

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'visit': return <MapPin size={16} className="text-purple-600" />;
      case 'meeting': return <User size={16} className="text-blue-600" />;
      case 'call': return <Phone size={16} className="text-green-600" />;
      case 'video': return <Video size={16} className="text-orange-600" />;
      default: return <Clock size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="animate-fade-in h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="text-brand-600" /> Agenda do Corretor
          </h2>
          <p className="text-gray-500 text-sm">Gerencie suas visitas, reuniões e follow-ups.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-1 flex gap-1">
            <button key="all" onClick={() => setFilterType('all')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterType === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Tudo</button>
            <button key="visit" onClick={() => setFilterType('visit')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterType === 'visit' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>Visitas</button>
            <button key="meeting" onClick={() => setFilterType('meeting')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterType === 'meeting' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>Reuniões</button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-brand-700 transition-colors text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Novo Agendamento
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
        {/* Main Calendar Grid */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ChevronLeft size={20} /></button>
            <h3 className="text-lg font-bold text-gray-900 capitalize">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ChevronRight size={20} /></button>
          </div>
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="py-2 text-center text-xs font-bold text-gray-400 uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1 overflow-y-auto">
            {loading ? <div className="col-span-7 flex justify-center items-center h-40"><Loader className="animate-spin text-brand-600" /></div> : renderCalendarGrid()}
          </div>
        </div>

        {/* Sidebar Daily Agenda */}
        <div className="w-full lg:w-96 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              {selectedDayTasks.length} compromissos pendentes
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedDayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                <Clock size={48} className="mb-4" />
                <p>Livre! Nenhum compromisso pendente.</p>
              </div>
            ) : (
              selectedDayTasks.map((task) => (
                <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-brand-200 hover:shadow-md transition-all group relative">
                  <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${task.type === 'visit' ? 'bg-purple-500' : task.type === 'call' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                  <div className="pl-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-1 uppercase tracking-wider`}>
                        {getTaskIcon(task.type)} {task.type}
                      </span>
                      <span className="text-xs font-bold text-gray-900">
                        {new Date(task.dueDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm mb-1">{task.title}</h4>
                    {task.lead && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <User size={12} />
                        <span className="font-medium">{task.lead.name}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleCompleteTask(task.id, e)}
                        className="flex-1 py-1.5 bg-green-50 text-green-700 rounded text-xs font-bold hover:bg-green-100 flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={12} /> Concluir
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="font-bold text-gray-900">Novo Agendamento</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Visita ao Imóvel X"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
                    value={newTask.date}
                    onChange={e => setNewTask({ ...newTask, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
                    value={newTask.time}
                    onChange={e => setNewTask({ ...newTask, time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tipo</label>
                <div className="flex gap-3">
                  {['visit', 'meeting', 'call'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewTask({ ...newTask, type: t })}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-2 ${newTask.type === t
                        ? t === 'visit' ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm ring-1 ring-purple-200'
                          : t === 'meeting' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-200'
                            : 'bg-green-50 border-green-500 text-green-700 shadow-sm ring-1 ring-green-200'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                      {t === 'visit' && <MapPin size={14} />}
                      {t === 'meeting' && <User size={14} />}
                      {t === 'call' && <Phone size={14} />}
                      <span className="capitalize">{t === 'visit' ? 'Visita' : t === 'meeting' ? 'Reunião' : 'Ligação'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lead Selector */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-700 mb-1">Vincular Lead (Opcional)</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar lead por nome ou telefone..."
                    className="w-full pl-10 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
                    value={leadSearch}
                    onChange={e => setLeadSearch(e.target.value)}
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-3">
                      <Loader size={16} className="animate-spin text-brand-600" />
                    </div>
                  )}
                </div>
                {leadSearch && leads.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-lg mt-1 z-10 max-h-48 overflow-y-auto animate-fade-in">
                    {leads.map(lead => (
                      <div
                        key={lead.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer text-sm flex justify-between items-center border-b border-gray-50 last:border-none"
                        onClick={() => {
                          setNewTask({ ...newTask, leadId: lead.id });
                          setLeadSearch(lead.name || lead.phone || 'Lead');
                          setLeads([]);
                        }}
                      >
                        <span className="font-bold text-gray-800">{lead.name || 'Sem nome'}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{lead.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
                {newTask.leadId && (
                  <div className="text-xs text-emerald-600 mt-2 font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                    <CheckCircle size={14} /> Lead selecionado com sucesso
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notas</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none h-24 resize-none transition-all shadow-sm"
                  placeholder="Detalhes adicionais..."
                  value={newTask.notes}
                  onChange={e => setNewTask({ ...newTask, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-all active:scale-[0.98] shadow-lg shadow-brand-200/50 flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Agendar Compromisso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;
