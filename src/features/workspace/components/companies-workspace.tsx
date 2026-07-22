'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Building2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/toast';
import type { PendingDelete, WorkspaceCompany } from './workspace-types';
import { useTranslations } from 'next-intl';

const emptyForm = { name: '', website: '', location: '', notes: '' };

export function CompaniesWorkspace() {
  const [items, setItems] = useState<WorkspaceCompany[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const t = useTranslations('workspace');
  const common = useTranslations('common');

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/companies');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to load companies');
      setItems(data.companies);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Failed to load companies'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const reset = () => { setEditingId(null); setForm(emptyForm); };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const response = await fetch(editingId ? `/api/companies/${editingId}` : '/api/companies', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save company');
      showToast(editingId ? 'Company updated.' : 'Company added.', 'success'); reset(); await load();
    } catch (saveError) { showToast(saveError instanceof Error ? saveError.message : 'Failed to save company', 'error'); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!pendingDelete) return; setSaving(true);
    try {
      const response = await fetch(`/api/companies/${pendingDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to remove company');
      setItems((current) => current.filter((item) => item.id !== pendingDelete.id)); setPendingDelete(null); showToast('Company removed. Its contacts were kept.', 'success');
    } catch (deleteError) { showToast(deleteError instanceof Error ? deleteError.message : 'Failed to remove company', 'error'); }
    finally { setSaving(false); }
  };

  return <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
    <form onSubmit={submit} className="h-fit space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-neutral-900">{editingId ? t('editCompany') : t('addCompany')}</h2>{(['name', 'website', 'location'] as const).map((field) => <input key={field} required={field === 'name'} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={t(field === 'name' ? 'companyName' : field)} className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />)}<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder={t('notes')} rows={4} className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" /><div className="flex gap-2"><button disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}{common('save')}</button>{editingId && <button type="button" onClick={reset} className="rounded-lg border px-3 text-sm">{common('cancel')}</button>}</div></form>
    <div>{loading ? <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-40 animate-pulse rounded-xl bg-neutral-100" />)}</div> : error ? <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}<button onClick={() => void load()} className="ml-3 font-semibold underline">Try again</button></div> : items.length === 0 ? <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center text-neutral-500"><Building2 className="mx-auto mb-3" /><p>No companies yet. Add companies you want to keep track of.</p></div> : <div className="grid gap-4 md:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-neutral-900">{item.name}</h3><p className="text-sm text-neutral-500">{item.location || 'Location not set'} · {item._count?.contacts ?? 0} contacts</p></div><div className="flex"><button onClick={() => { setEditingId(item.id); setForm({ name: item.name, website: item.website || '', location: item.location || '', notes: item.notes || '' }); }} className="p-2 text-neutral-500 hover:text-primary-600" aria-label="Edit company"><Pencil size={16} /></button><button onClick={() => setPendingDelete({ id: item.id, label: item.name })} className="p-2 text-neutral-500 hover:text-red-600" aria-label="Delete company"><Trash2 size={16} /></button></div></div>{item.website && <a href={item.website} target="_blank" rel="noreferrer" className="mt-3 block truncate text-sm text-primary-600">{item.website}</a>}{item.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-600">{item.notes}</p>}</article>)}</div>}</div>
    <ConfirmationDialog isOpen={Boolean(pendingDelete)} title="Delete company?" description={`${pendingDelete?.label || 'This company'} will be removed. Linked contacts will be kept and unlinked from the company.`} confirmLabel="Delete" variant="destructive" isLoading={saving} onClose={() => setPendingDelete(null)} onConfirm={() => void remove()} />
  </div>;
}
