'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Check, FileText, Loader2, Pencil, Plus, Tag as TagIcon, Trash2, X } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/toast';
import type { WorkspaceApplication, WorkspaceTag } from './workspace-types';

type Note = { id: string; content: string; updatedAt: string; application: WorkspaceApplication };
type DeleteTarget = { kind: 'notes' | 'tags'; id: string; label: string } | null;
const colors: WorkspaceTag['color'][] = ['blue', 'green', 'amber', 'red', 'purple', 'neutral'];
const tagStyles: Record<WorkspaceTag['color'], string> = { blue: 'bg-blue-100 text-blue-700', green: 'bg-green-100 text-green-700', amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700', purple: 'bg-purple-100 text-purple-700', neutral: 'bg-neutral-100 text-neutral-700' };

export function NotesWorkspace() {
  const [applications, setApplications] = useState<WorkspaceApplication[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<WorkspaceTag[]>([]);
  const [applicationId, setApplicationId] = useState('');
  const [content, setContent] = useState('');
  const [tagForm, setTagForm] = useState({ name: '', color: 'blue' as WorkspaceTag['color'] });
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingTag, setEditingTag] = useState<WorkspaceTag | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setError('');
    try {
      const [applicationResponse, noteResponse, tagResponse] = await Promise.all([fetch('/api/applications'), fetch('/api/notes'), fetch('/api/tags')]);
      const [applicationData, noteData, tagData] = await Promise.all([applicationResponse.json(), noteResponse.json(), tagResponse.json()]);
      if (!applicationResponse.ok || !noteResponse.ok || !tagResponse.ok) throw new Error(applicationData.message || noteData.message || tagData.message || 'Failed to load notes');
      setApplications(applicationData.applications || []); setNotes(noteData.notes || []); setTags(tagData.tags || []);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Failed to load notes'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const selectedApplication = useMemo(() => applications.find((application) => application.id === applicationId), [applications, applicationId]);
  const selectedTagIds = new Set(selectedApplication?.tags?.map(({ tag }) => tag.id) || []);

  const addNote = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const response = await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId, content }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Failed to save note');
      setContent(''); await load(); showToast('Note saved.', 'success');
    } catch (saveError) { showToast(saveError instanceof Error ? saveError.message : 'Failed to save note', 'error'); }
    finally { setSaving(false); }
  };
  const saveNote = async () => {
    if (!editingNote) return; setSaving(true);
    try { const response = await fetch(`/api/notes/${editingNote.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: editingNote.content }) }); if (!response.ok) throw new Error('Failed to update note'); setEditingNote(null); await load(); showToast('Note updated.', 'success'); }
    catch (saveError) { showToast(saveError instanceof Error ? saveError.message : 'Failed to update note', 'error'); }
    finally { setSaving(false); }
  };
  const saveTag = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try { const response = await fetch(editingTag ? `/api/tags/${editingTag.id}` : '/api/tags', { method: editingTag ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tagForm) }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Failed to save tag'); setTagForm({ name: '', color: 'blue' }); setEditingTag(null); await load(); showToast(editingTag ? 'Tag updated.' : 'Tag created.', 'success'); }
    catch (saveError) { showToast(saveError instanceof Error ? saveError.message : 'Failed to save tag', 'error'); }
    finally { setSaving(false); }
  };
  const toggleTag = async (tagId: string) => {
    if (!applicationId) return; const attached = selectedTagIds.has(tagId); setSaving(true);
    try { const response = await fetch('/api/tags/applications', { method: attached ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId, tagId }) }); if (!response.ok) throw new Error('Failed to update application tags'); await load(); showToast(attached ? 'Tag removed from application.' : 'Tag added to application.', 'success'); }
    catch (saveError) { showToast(saveError instanceof Error ? saveError.message : 'Failed to update tags', 'error'); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!pendingDelete) return; setSaving(true);
    try { const response = await fetch(`/api/${pendingDelete.kind}/${pendingDelete.id}`, { method: 'DELETE' }); if (!response.ok) throw new Error(`Failed to remove ${pendingDelete.kind.slice(0, -1)}`); setPendingDelete(null); await load(); showToast('Item removed.', 'success'); }
    catch (deleteError) { showToast(deleteError instanceof Error ? deleteError.message : 'Failed to remove item', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="grid gap-5 xl:grid-cols-[1fr_320px]"><div className="h-80 animate-pulse rounded-xl bg-neutral-100" /><div className="h-64 animate-pulse rounded-xl bg-neutral-100" /></div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}<button onClick={() => void load()} className="ml-3 font-semibold underline">Try again</button></div>;

  return <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
    <div className="space-y-5"><form onSubmit={addNote} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"><select required value={applicationId} onChange={(event) => setApplicationId(event.target.value)} className="w-full rounded-lg border px-3 py-2.5 text-sm"><option value="">Choose an application</option>{applications.map((application) => <option key={application.id} value={application.id}>{application.vacancy.title} — {application.vacancy.company || 'Company not set'}</option>)}</select><textarea required value={content} onChange={(event) => setContent(event.target.value)} rows={4} placeholder="Write a private note…" className="w-full rounded-lg border px-3 py-2.5 text-sm" /><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}Add note</button></form>
      {notes.length === 0 ? <div className="rounded-xl border border-dashed bg-white p-12 text-center text-neutral-500"><FileText className="mx-auto mb-3" />No application notes yet.</div> : notes.map((note) => <article key={note.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{note.application.vacancy.title}</h3><p className="text-sm text-neutral-500">{note.application.vacancy.company || 'Company not set'} · {new Date(note.updatedAt).toLocaleDateString()}</p></div><div className="flex"><button onClick={() => setEditingNote({ ...note })} className="p-2 text-neutral-400 hover:text-primary-600" aria-label="Edit note"><Pencil size={16} /></button><button onClick={() => setPendingDelete({ kind: 'notes', id: note.id, label: 'this note' })} className="p-2 text-neutral-400 hover:text-red-600" aria-label="Delete note"><Trash2 size={16} /></button></div></div>{editingNote?.id === note.id ? <div className="mt-4"><textarea value={editingNote.content} onChange={(event) => setEditingNote({ ...editingNote, content: event.target.value })} rows={5} className="w-full rounded-lg border px-3 py-2.5 text-sm" /><div className="mt-2 flex gap-2"><button disabled={saving || !editingNote.content.trim()} onClick={() => void saveNote()} className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white">Save</button><button onClick={() => setEditingNote(null)} className="rounded-lg border px-3 py-2 text-sm">Cancel</button></div></div> : <p className="mt-4 whitespace-pre-wrap text-sm text-neutral-700">{note.content}</p>}</article>)}</div>
    <aside className="h-fit space-y-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"><div><h2 className="flex items-center gap-2 font-semibold"><TagIcon size={18} />Application tags</h2><p className="mt-1 text-xs text-neutral-500">Choose an application on the left, then assign tags here.</p></div>
      <form onSubmit={saveTag} className="space-y-2"><input required value={tagForm.name} onChange={(event) => setTagForm({ ...tagForm, name: event.target.value })} placeholder="Tag name" className="w-full rounded-lg border px-3 py-2 text-sm" /><div className="flex gap-2"><select value={tagForm.color} onChange={(event) => setTagForm({ ...tagForm, color: event.target.value as WorkspaceTag['color'] })} className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm">{colors.map((color) => <option key={color}>{color}</option>)}</select><button disabled={saving} className="rounded-lg bg-primary-600 px-3 text-white" aria-label={editingTag ? 'Save tag' : 'Create tag'}>{editingTag ? <Check size={18} /> : <Plus size={18} />}</button>{editingTag && <button type="button" onClick={() => { setEditingTag(null); setTagForm({ name: '', color: 'blue' }); }} className="rounded-lg border px-3" aria-label="Cancel editing tag"><X size={18} /></button>}</div></form>
      <div className="space-y-2">{tags.length === 0 ? <p className="rounded-lg bg-neutral-50 p-4 text-center text-sm text-neutral-500">No tags yet.</p> : tags.map((tag) => <div key={tag.id} className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2"><button disabled={!applicationId || saving} onClick={() => void toggleTag(tag.id)} className={`min-w-0 flex-1 rounded-full px-2.5 py-1 text-left text-xs font-medium ${tagStyles[tag.color]} disabled:opacity-50`} aria-pressed={selectedTagIds.has(tag.id)}>{selectedTagIds.has(tag.id) ? '✓ ' : ''}{tag.name} <span className="opacity-60">({tag._count.applications})</span></button><button onClick={() => { setEditingTag(tag); setTagForm({ name: tag.name, color: tag.color }); }} className="text-neutral-400 hover:text-primary-600" aria-label="Edit tag"><Pencil size={14} /></button><button onClick={() => setPendingDelete({ kind: 'tags', id: tag.id, label: tag.name })} className="text-neutral-400 hover:text-red-600" aria-label="Delete tag"><Trash2 size={14} /></button></div>)}</div>
    </aside>
    <ConfirmationDialog isOpen={Boolean(pendingDelete)} title={`Delete ${pendingDelete?.kind === 'tags' ? 'tag' : 'note'}?`} description={`${pendingDelete?.label || 'This item'} will be permanently removed${pendingDelete?.kind === 'tags' ? ' from every application' : ''}.`} confirmLabel="Delete" variant="destructive" isLoading={saving} onClose={() => setPendingDelete(null)} onConfirm={() => void remove()} />
  </div>;
}
