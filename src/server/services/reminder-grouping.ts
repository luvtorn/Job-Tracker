export type ReminderGroup = 'overdue' | 'today' | 'upcoming' | 'completed';

export const getReminderGroup = (dueAt: Date, completedAt: Date | null, now = new Date()): ReminderGroup => {
  if (completedAt) return 'completed';
  const dueDay = new Date(dueAt.getFullYear(), dueAt.getMonth(), dueAt.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (dueDay < today) return 'overdue';
  if (dueDay === today) return 'today';
  return 'upcoming';
};
