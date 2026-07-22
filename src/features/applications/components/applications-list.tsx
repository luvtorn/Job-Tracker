'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, DollarSign, Loader, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';

type Vacancy = { id: string; title: string; company: string; location: string; position?: string; salaryMin?: number; salaryMax?: number; currency: string };
type Application = { id: string; status: string; createdAt: string; interviewDate?: string; interviewTime?: string; interviewNotes?: string; vacancy: Vacancy; tags?: Array<{ tag: { id: string; name: string; color: string } }> };

const statuses = ['APPLIED', 'INTERVIEWING', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'] as const;
const tabs = ['all', 'INTERVIEWING', 'OFFER', 'REJECTED'] as const;
const statusColors: Record<string, string> = { APPLIED: 'bg-blue-100 text-blue-700', INTERVIEWING: 'bg-purple-100 text-purple-700', OFFER: 'bg-green-100 text-green-700', ACCEPTED: 'bg-emerald-100 text-emerald-700', REJECTED: 'bg-red-100 text-red-700', WITHDRAWN: 'bg-neutral-100 text-neutral-700' };
const tagColors: Record<string, string> = { blue: 'bg-blue-100 text-blue-700', green: 'bg-green-100 text-green-700', amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700', purple: 'bg-purple-100 text-purple-700', neutral: 'bg-neutral-100 text-neutral-700' };

export function ApplicationsList() {
  const t = useTranslations('applicationsUi');
  const loadErrors = useTranslations('loadErrors');
  const candidateT = useTranslations('candidates');
  const statusT = useTranslations('statuses');
  const locale = useLocale();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [view, setView] = useState<'list' | 'board'>('list');
  const statusLabel = (status: string) => statusT(status.toLowerCase() as 'applied' | 'interviewing' | 'offer' | 'accepted' | 'rejected' | 'withdrawn');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/applications');
        const data = await response.json();
        if (!response.ok) throw new Error(loadErrors('applications'));
        setApplications(data.applications || []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : loadErrors('applications'));
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [loadErrors]);

  if (isLoading) return <div className="flex justify-center py-12"><Loader className="animate-spin text-primary-600" size={24} /></div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>;
  if (applications.length === 0) return <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center"><p className="mb-2 text-xl font-medium text-neutral-600">{t('empty')}</p><p className="text-neutral-500">{t('emptyHint')}</p></div>;

  const filtered = activeTab === 'all' ? applications : applications.filter((application) => application.status === activeTab);

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-2">
      <div className="flex gap-2 overflow-x-auto">{tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-lg px-4 py-2.5 font-medium ${activeTab === tab ? 'bg-primary-600 text-white shadow-md' : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'}`}>{tab === 'all' ? t('all') : tab === 'OFFER' ? t('offers') : statusLabel(tab)}{tab !== 'all' && <span className="ml-2 rounded bg-white/30 px-2 py-0.5 text-xs">{applications.filter((application) => application.status === tab).length}</span>}</button>)}</div>
      <div className="inline-flex rounded-lg bg-neutral-100 p-1" role="group">{(['list', 'board'] as const).map((item) => <button key={item} onClick={() => setView(item)} aria-pressed={view === item} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === item ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-600'}`}>{candidateT(item)}</button>)}</div>
    </div>
    {view === 'board' ? <div className="overflow-x-auto pb-3"><div className="grid min-w-[1200px] grid-cols-6 gap-4">{statuses.map((status) => <section key={status} className="min-h-64 rounded-xl border border-neutral-200 bg-neutral-50 p-3"><div className="mb-3 flex items-center justify-between"><h3 className={`text-sm font-semibold ${statusColors[status].split(' ')[1]}`}>{statusLabel(status)}</h3><span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold">{applications.filter((application) => application.status === status).length}</span></div><div className="space-y-3">{applications.filter((application) => application.status === status).map((application) => <Link key={application.id} href={`/jobs/${application.vacancy.id}`} className="block rounded-lg border border-neutral-200 bg-white p-3 shadow-sm hover:border-primary-300"><p className="font-semibold text-neutral-900">{application.vacancy.title}</p><p className="mt-1 text-xs text-neutral-500">{application.vacancy.company}</p><p className="mt-2 text-xs text-neutral-500">{candidateT('appliedOn', { date: new Date(application.createdAt).toLocaleDateString(locale) })}</p></Link>)}</div></section>)}</div></div> : filtered.length === 0 ? <div className="rounded-lg border bg-white p-12 text-center text-neutral-600">{t('emptyCategory')}</div> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map((application) => <Link key={application.id} href={`/jobs/${application.vacancy.id}`} className="group rounded-lg border border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-lg">
      <div className="mb-4 flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="line-clamp-2 text-lg font-semibold group-hover:text-primary-600">{application.vacancy.title}</h3><p className="mt-1 text-sm text-neutral-600">{application.vacancy.company}</p></div><span className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${statusColors[application.status]}`}>{statusLabel(application.status)}</span></div>
      <div className="mb-4 space-y-3 text-sm text-neutral-600"><p className="flex items-center gap-2"><MapPin size={16} />{application.vacancy.location}</p>{application.vacancy.salaryMin && <p className="flex items-center gap-2"><DollarSign size={16} />{application.vacancy.salaryMin.toLocaleString(locale)} – {application.vacancy.salaryMax?.toLocaleString(locale) || t('salaryMissing')} {application.vacancy.currency}</p>}{application.vacancy.position && <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{application.vacancy.position}</span>}{application.tags && <div className="flex flex-wrap gap-2">{application.tags.map(({ tag }) => <span key={tag.id} className={`rounded-full px-2.5 py-1 text-xs font-medium ${tagColors[tag.color] || tagColors.neutral}`}>{tag.name}</span>)}</div>}</div>
      {application.status === 'INTERVIEWING' && <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800"><p className="text-xs font-semibold">{candidateT('interviewScheduled')}</p>{application.interviewDate ? <p className="mt-1">{new Date(application.interviewDate).toLocaleDateString(locale)} {candidateT('at')} {application.interviewTime}</p> : <p className="mt-1 italic">{t('interviewPending')}</p>}{application.interviewNotes && <p className="mt-2 text-xs italic">{application.interviewNotes}</p>}</div>}
      <div className="flex items-center gap-1 border-t border-neutral-100 pt-4 text-xs text-neutral-500"><Calendar size={14} />{candidateT('appliedOn', { date: new Date(application.createdAt).toLocaleDateString(locale) })}</div>
    </Link>)}</div>}
  </motion.div>;
}
