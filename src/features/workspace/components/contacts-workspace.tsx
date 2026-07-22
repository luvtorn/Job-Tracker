'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Loader2, Mail, Pencil, Phone, Plus, Trash2, Users } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';
import type { PendingDelete, WorkspaceCompany } from './workspace-types';

type Contact = { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; role: string | null; notes: string | null; company: Pick<WorkspaceCompany, 'id' | 'name'> | null };
const initial = { firstName: '', lastName: '', email: '', phone: '', role: '', notes: '', companyId: '' };

export function ContactsWorkspace() {
  const [items, setItems] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<WorkspaceCompany[]>([]);
  const [form, setForm] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const t = useTranslations('workspace');
  const actions = useTranslations('workspaceActions');
  const common = useTranslations('common');

  const load = useCallback(async () => {
    setError('');
    try {
      const [contactsResponse, companiesResponse] = await Promise.all([fetch('/api/contacts'), fetch('/api/companies')]);
      const [contactsData, companiesData] = await Promise.all([contactsResponse.json(), companiesResponse.json()]);
      if (!contactsResponse.ok || !companiesResponse.ok) throw new Error(actions('contactsLoadFailed'));
      setItems(contactsData.contacts);
      setCompanies(companiesData.companies);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : actions('contactsLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [actions]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(editingId ? `/api/contacts/${editingId}` : '/api/contacts', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, companyId: form.companyId || null }) });
      if (!response.ok) throw new Error(actions('contactSaveFailed'));
      showToast(editingId ? actions('contactUpdated') : actions('contactAdded'), 'success');
      setEditingId(null);
      setForm(initial);
      await load();
    } catch (saveError) {
      showToast(saveError instanceof Error ? saveError.message : actions('contactSaveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const edit = (contact: Contact) => {
    setEditingId(contact.id);
    setForm({ firstName: contact.firstName, lastName: contact.lastName, email: contact.email || '', phone: contact.phone || '', role: contact.role || '', notes: contact.notes || '', companyId: contact.company?.id || '' });
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/contacts/${pendingDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(actions('contactRemoveFailed'));
      setItems((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      showToast(actions('contactRemoved'), 'success');
    } catch (deleteError) {
      showToast(deleteError instanceof Error ? deleteError.message : actions('contactRemoveFailed'), 'error');
    } finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <form onSubmit={submit} className="grid gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4">
      <input required placeholder={actions('firstName')} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className="rounded-lg border px-3 py-2.5 text-sm" />
      <input required placeholder={actions('lastName')} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className="rounded-lg border px-3 py-2.5 text-sm" />
      <input type="email" placeholder={actions('email')} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="rounded-lg border px-3 py-2.5 text-sm" />
      <input placeholder={actions('phone')} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="rounded-lg border px-3 py-2.5 text-sm" />
      <input placeholder={actions('role')} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="rounded-lg border px-3 py-2.5 text-sm" />
      <select value={form.companyId} onChange={(event) => setForm({ ...form, companyId: event.target.value })} className="rounded-lg border px-3 py-2.5 text-sm"><option value="">{t('noCompany')}</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>
      <input placeholder={t('notes')} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="rounded-lg border px-3 py-2.5 text-sm" />
      <div className="flex gap-2"><button disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}{editingId ? common('save') : t('addContact')}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(initial); }} className="rounded-lg border px-3 text-sm">{common('cancel')}</button>}</div>
    </form>
    {loading ? <WorkspaceSkeleton /> : error ? <ErrorState message={error} retry={() => void load()} retryLabel={common('tryAgain')} /> : items.length === 0 ? <div className="rounded-xl border border-dashed bg-white p-12 text-center text-neutral-500"><Users className="mx-auto mb-3" /><p>{t('noContacts')}</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><div><h3 className="font-semibold">{item.firstName} {item.lastName}</h3><p className="text-sm text-neutral-500">{item.role || t('roleMissing')}{item.company ? ` · ${item.company.name}` : ''}</p></div><div className="flex"><button onClick={() => edit(item)} className="p-2 text-neutral-400 hover:text-primary-600" aria-label={t('editContact')}><Pencil size={16} /></button><button onClick={() => setPendingDelete({ id: item.id, label: `${item.firstName} ${item.lastName}` })} className="p-2 text-neutral-400 hover:text-red-600" aria-label={t('deleteContact')}><Trash2 size={16} /></button></div></div>{item.email && <a href={`mailto:${item.email}`} className="mt-4 flex items-center gap-2 text-sm text-primary-600"><Mail size={14} />{item.email}</a>}{item.phone && <p className="mt-2 flex items-center gap-2 text-sm text-neutral-600"><Phone size={14} />{item.phone}</p>}{item.notes && <p className="mt-3 text-sm text-neutral-600">{item.notes}</p>}</article>)}</div>}
    <ConfirmationDialog isOpen={Boolean(pendingDelete)} title={actions('deleteContactTitle')} description={actions('deleteContactDescription', { contact: pendingDelete?.label || actions('thisContact') })} confirmLabel={common('delete')} variant="destructive" isLoading={saving} onClose={() => setPendingDelete(null)} onConfirm={() => void remove()} />
  </div>;
}

function WorkspaceSkeleton() { return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-xl bg-neutral-100" />)}</div>; }
function ErrorState({ message, retry, retryLabel }: { message: string; retry: () => void; retryLabel: string }) { return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center"><p className="text-sm text-red-700">{message}</p><button onClick={retry} className="mt-3 text-sm font-semibold text-red-700 underline">{retryLabel}</button></div>; }
