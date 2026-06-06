import { Lead, Task } from '../../../../types';

export type QuickActionType = 'schedule' | 'whatsapp' | 'email' | 'note' | null;
export type ActiveProfileTab = 'MASTER' | 'WA' | 'SF' | 'PD' | 'RD';

export const getActivityStatus = (tasks: Task[]): 'overdue' | 'today' | 'future' | 'none' => {
    const pending = tasks?.filter(t => !t.completed);
    if (!pending?.length) return 'none';
    const today = new Date().toISOString().split('T')[0];
    const nextTask = pending.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
    const taskDate = new Date(nextTask.dueDate).toISOString().split('T')[0];
    if (taskDate < today) return 'overdue';
    if (taskDate === today) return 'today';
    return 'future';
};

export const getNextTaskInfo = (tasks: Task[]) => {
    const pending = tasks?.filter(t => !t.completed);
    if (!pending?.length) return null;
    const next = pending.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
    const today = new Date().toISOString().split('T')[0];
    const taskDate = new Date(next.dueDate).toISOString().split('T')[0];
    const isOverdue = taskDate < today;
    const isToday = taskDate === today;
    return {
        task: next,
        isOverdue,
        isToday,
        label: isOverdue ? 'Atrasado' : isToday ? 'Hoje' : new Date(next.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    };
};
