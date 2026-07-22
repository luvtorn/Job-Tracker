'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Bell, Check, Loader2, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/toast';
import type { PendingDelete, WorkspaceApplication } from './workspace-types';

type Group = 'overdue' | 'today' | 'upcoming' | 'completed';
type Reminder = { id: string; title: string; dueAt: string; completedAt: string | null; group: Group; application: WorkspaceApplication | null };
const groups: Group[] = ['overdue', 'today', 'upcoming', 'completed'];
const initialForm = { title: '', dueAt: '', applicationId: '' };
const toLocalInput = (value: string) => { const date = new Date(value); const offset = date.getTimezoneOffset() * 60_000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); };

export function RemindersWorkspace({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('workspace');
  const common = useTranslations('common');
  const locale = useLocale();
  const [items, setItems] = useState<Reminder[]>([]);
  const [applications, setApplications] = useState<WorkspaceApplication[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setError('');
    try {
      const [reminderResponse, applicationResponse] = await Promise.all([fetch('/api/reminders'), fetch('/api/applications')]);
      const [reminderData, applicationData] = await Promise.all([reminderResponse.json(), applicationResponse.json()]);
      if (!reminderResponse.ok || !applicationResponse.ok) throw new Error(t('remindersLoadFailed'));
      setItems(reminderData.reminders || []); setApplications(applicationData.applications || []);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : t('remindersLoadFailed')); }
    finally { setLoading(false); }
  }, [t]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const reset = () => { setEditingId(null); setForm(initialForm); };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const response = await fetch(editingId ? `/api/reminders/${editingId}` : '/api/reminders', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: form.title, dueAt: new Date(form.dueAt).toISOString(), applicationId: form.applicationId || null }) });
      if (!response.ok) throw new Error(t('reminderSaveFailed'));
      showToast(editingId ? t('reminderUpdated') : t('reminderCreated'), 'success'); reset(); await load();
    } catch (saveError) { showToast(saveError instanceof Error ? saveError.message : t('reminderSaveFailed'), 'error'); }
    finally { setSaving(false); }
  };
  const toggleComplete = async (item: Reminder) => {
    setSaving(true);
    try { const response = await fetch(`/api/reminders/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !item.completedAt }) }); if (!response.ok) throw new Error(t('reminderUpdateFailed')); await load(); showToast(item.completedAt ? t('reminderReopened') : t('reminderCompleted'), 'success'); }
    catch (saveError) { showToast(saveError instanceof Error ? saveError.message : t('reminderUpdateFailed'), 'error'); }
    finally { setSaving(false); }
  };
  const edit = (item: Reminder) => { setEditingId(item.id); setForm({ title: item.title, dueAt: toLocalInput(item.dueAt), applicationId: item.application?.id || '' }); };
  const remove = async () => {
    if (!pendingDelete) return; setSaving(true);
    try { const response = await fetch(`/api/reminders/${pendingDelete.id}`, { method: 'DELETE' }); if (!response.ok) throw new Error(t('reminderRemoveFailed')); setItems((current) => current.filter((item) => item.id !== pendingDelete.id)); setPendingDelete(null); showToast(t('reminderRemoved'), 'success'); }
    catch (deleteError) { showToast(deleteError instanceof Error ? deleteError.message : t('reminderRemoveFailed'), 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return compact ? <div className="h-32 animate-pulse rounded-xl bg-neutral-100" /> : <div className="grid gap-4 xl:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-xl bg-neutral-100" />)}</div>;
  if (compact) { const due = items.filter((item) => item.group === 'overdue' || item.group === 'today').slice(0, 5); return <div className="rounded-xl border border-neutral-200 bg-white p-5">{error ? <p className="text-sm text-red-600">{error}</p> : due.length === 0 ? <p className="text-sm text-neutral-500">{t('noRemindersDue')}</p> : <div className="space-y-3">{due.map((item) => <div key={item.id} className="flex items-center gap-3"><Bell size={16} className={item.group === 'overdue' ? 'text-red-500' : 'text-amber-500'} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.title}</p><p className="text-xs text-neutral-500">{item.group === 'overdue' ? t('overdue') : new Date(item.dueAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</p></div></div>)}</div>}</div>; }
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}<button onClick={() => void load()} className="ml-3 font-semibold underline">{common('tryAgain')}</button></div>;

  return <div className="space-y-6"><form onSubmit={submit} className="grid gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4"><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t('reminderTitle')} className="rounded-lg border px-3 py-2.5 text-sm" /><input required type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} className="rounded-lg border px-3 py-2.5 text-sm" /><select value={form.applicationId} onChange={(event) => setForm({ ...form, applicationId: event.target.value })} className="rounded-lg border px-3 py-2.5 text-sm"><option value="">{t('noApplication')}</option>{applications.map((application) => <option key={application.id} value={application.id}>{application.vacancy.title}</option>)}</select><div className="flex gap-2"><button disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}{editingId ? common('save') : common('create')}</button>{editingId && <button type="button" onClick={reset} className="rounded-lg border px-3 text-sm">{common('cancel')}</button>}</div></form>
    <div className="grid gap-5 xl:grid-cols-2">{groups.map((group) => { const groupItems = items.filter((item) => item.group === group); const groupLabel = t(group); return <section key={group}><h2 className="mb-3 font-semibold text-neutral-900">{groupLabel} <span className="text-sm text-neutral-400">{groupItems.length}</span></h2><div className="space-y-3">{groupItems.length === 0 ? <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-neutral-500">{t('noReminders', { group: groupLabel.toLocaleLowerCase(locale) })}</div> : groupItems.map((item) => <article key={item.id} className={`rounded-xl border bg-white p-4 shadow-sm ${group === 'overdue' ? 'border-red-200' : 'border-neutral-200'}`}><div className="flex items-start gap-3"><button disabled={saving} onClick={() => void toggleComplete(item)} className="mt-0.5 rounded-full border p-1 text-neutral-500 hover:text-primary-600 disabled:opacity-50" aria-label={item.completedAt ? t('reopenReminder') : t('completeReminder')}>{item.completedAt ? <RotateCcw size={14} /> : <Check size={14} />}</button><div className="min-w-0 flex-1"><p className={item.completedAt ? 'text-sm text-neutral-500 line-through' : 'text-sm font-medium text-neutral-900'}>{item.title}</p><p className="mt-1 text-xs text-neutral-500">{new Date(item.dueAt).toLocaleString(locale)}{item.application ? ` · ${item.application.vacancy.title}` : ''}</p></div><button onClick={() => edit(item)} className="text-neutral-400 hover:text-primary-600" aria-label={t('editReminder')}><Pencil size={15} /></button><button onClick={() => setPendingDelete({ id: item.id, label: item.title })} className="text-neutral-400 hover:text-red-600" aria-label={t('deleteReminder')}><Trash2 size={15} /></button></div></article>)}</div></section>; })}</div>
    <ConfirmationDialog isOpen={Boolean(pendingDelete)} title={t('deleteReminderTitle')} description={t('deleteReminderDescription', { title: pendingDelete?.label || t('thisReminder') })} confirmLabel={common('delete')} variant="destructive" isLoading={saving} onClose={() => setPendingDelete(null)} onConfirm={() => void remove()} />
  </div>;
}
