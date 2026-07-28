'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { DollarSign, Grid2X2, Loader, MapPin, Search, Table2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/features/auth/context/auth-context';
import { WishlistToggle } from './wishlist-toggle';

type Vacancy = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements?: string;
  position?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  createdAt: string;
  publishedAt?: string;
};

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type WishlistItem = {
  id: string;
  vacancy: { id: string };
};

type Filters = {
  search: string;
  location: string;
};

type ViewMode = 'cards' | 'table';

const VIEW_STORAGE_KEY = 'job-tracker.jobs-view';

export function JobsList() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const t = useTranslations('jobs');
  const locale = useLocale();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [filters, setFilters] = useState<Filters>({ search: '', location: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [wishlistByVacancy, setWishlistByVacancy] = useState<Record<string, string>>({});
  const isSeeker = user?.role === 'SEEKER';

  const commitFilters = (nextFilters: Filters) => {
    setCurrentPage(1);
    setFilters((current) => (
      current.search === nextFilters.search && current.location === nextFilters.location
        ? current
        : nextFilters
    ));
  };

  useEffect(() => {
    const savedView = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (savedView === 'cards' || savedView === 'table') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Restoring an explicit browser preference after hydration.
      setViewMode(savedView);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      commitFilters({ search: searchQuery.trim(), location: locationFilter.trim() });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [locationFilter, searchQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const loadVacancies = async () => {
      const hasResults = vacancies.length > 0;
      setError('');
      if (hasResults) setIsRefreshing(true);
      else setIsInitialLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
        });
        if (filters.search) params.set('search', filters.search);
        if (filters.location) params.set('location', filters.location);
        const response = await fetch(`/api/jobs?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error(t('loadFailed'));
        const data = await response.json();
        setVacancies(data.vacancies || []);
        setPagination(data.pagination);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return;
        console.error('Failed to fetch vacancies:', loadError);
        setError(t('loadFailed'));
      } finally {
        if (!controller.signal.aborted) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    };
    void loadVacancies();
    return () => controller.abort();
    // vacancies is intentionally excluded so background loading can preserve the current results.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters, t]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isSeeker) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Wishlist state must be cleared when the active role changes.
      setWishlistByVacancy({});
      return;
    }
    const controller = new AbortController();
    const loadWishlist = async () => {
      try {
        const response = await fetch('/api/wishlist', { signal: controller.signal });
        if (!response.ok) throw new Error(t('favoriteLoadFailed'));
        const result: { data?: WishlistItem[] } = await response.json();
        setWishlistByVacancy(Object.fromEntries((result.data ?? []).map((item) => [item.vacancy.id, item.id])));
      } catch (wishlistError) {
        if (wishlistError instanceof DOMException && wishlistError.name === 'AbortError') return;
        console.error('Failed to load wishlist:', wishlistError);
      }
    };
    void loadWishlist();
    return () => controller.abort();
  }, [isAuthLoading, isSeeker, t]);

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    commitFilters({ search: searchQuery.trim(), location: locationFilter.trim() });
  };

  const changeView = (view: ViewMode) => {
    setViewMode(view);
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  };

  const updateWishlist = (vacancyId: string, itemId?: string) => {
    setWishlistByVacancy((current) => {
      if (itemId) return { ...current, [vacancyId]: itemId };
      const next = { ...current };
      delete next[vacancyId];
      return next;
    });
  };

  const formatSalary = (vacancy: Vacancy) => {
    if (!vacancy.salaryMin) return t('notAvailable');
    return `${vacancy.salaryMin.toLocaleString(locale)} – ${vacancy.salaryMax?.toLocaleString(locale) || t('notAvailable')} ${vacancy.currency}`;
  };

  if (isInitialLoading && vacancies.length === 0) {
    return <div className="flex items-center justify-center py-12"><Loader className="animate-spin text-primary-600" size={24} /></div>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={applyFilters} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="relative">
            <span className="sr-only">{t('searchLabel')}</span>
            <Search className="absolute left-3 top-3 text-neutral-400" size={18} aria-hidden="true" />
            <input type="search" placeholder={t('search')} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="w-full rounded-lg border border-neutral-200 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </label>
          <label className="relative">
            <span className="sr-only">{t('locationLabel')}</span>
            <MapPin className="absolute left-3 top-3 text-neutral-400" size={18} aria-hidden="true" />
            <input type="search" placeholder={t('location')} value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="w-full rounded-lg border border-neutral-200 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </label>
          <button type="submit" className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-700">{t('searchButton')}</button>
        </div>
      </form>

      <div className="flex min-h-10 items-center justify-between gap-3">
        <div aria-live="polite" className="text-sm text-neutral-500">
          {isRefreshing && <span className="inline-flex items-center gap-2"><Loader size={14} className="animate-spin" />{t('updating')}</span>}
        </div>
        <div role="group" aria-label={t('viewMode')} className="flex rounded-lg border border-neutral-200 bg-white p-1">
          <ViewButton active={viewMode === 'cards'} label={t('cards')} onClick={() => changeView('cards')}><Grid2X2 size={17} /></ViewButton>
          <ViewButton active={viewMode === 'table'} label={t('table')} onClick={() => changeView('table')}><Table2 size={17} /></ViewButton>
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      {!error && vacancies.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-neutral-600">{t('empty')}</div>
      ) : viewMode === 'cards' ? (
        <div className="space-y-4">
          {vacancies.map((vacancy) => (
            <article key={vacancy.id} className="rounded-lg border border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-md">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/jobs/${vacancy.id}`} className="text-lg font-semibold text-neutral-900 hover:text-primary-600">{vacancy.title}</Link>
                  <p className="text-neutral-600">{vacancy.company}</p>
                </div>
                {isSeeker && <WishlistToggle vacancyId={vacancy.id} vacancyTitle={vacancy.title} itemId={wishlistByVacancy[vacancy.id]} onChange={(itemId) => updateWishlist(vacancy.id, itemId)} />}
              </div>
              <p className="mb-4 line-clamp-2 text-sm text-neutral-600">{vacancy.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                <span className="flex items-center gap-1"><MapPin size={16} aria-hidden="true" />{vacancy.location}</span>
                {vacancy.salaryMin && <span className="flex items-center gap-1"><DollarSign size={16} aria-hidden="true" />{formatSalary(vacancy)}</span>}
                {vacancy.position && <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">{vacancy.position}</span>}
              </div>
              <p className="mt-3 text-xs text-neutral-500">{t('posted', { date: new Date(vacancy.publishedAt || vacancy.createdAt).toLocaleDateString(locale) })}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">{t('titleColumn')}</th>
                <th className="px-4 py-3">{t('companyColumn')}</th>
                <th className="px-4 py-3">{t('locationColumn')}</th>
                <th className="px-4 py-3">{t('typeColumn')}</th>
                <th className="px-4 py-3">{t('salaryColumn')}</th>
                <th className="px-4 py-3">{t('dateColumn')}</th>
                {isSeeker && <th className="px-4 py-3 text-right">{t('actionsColumn')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {vacancies.map((vacancy) => (
                <tr key={vacancy.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-4 font-semibold"><Link href={`/jobs/${vacancy.id}`} className="text-neutral-900 hover:text-primary-600">{vacancy.title}</Link></td>
                  <td className="px-4 py-4 text-neutral-600">{vacancy.company}</td>
                  <td className="px-4 py-4 text-neutral-600">{vacancy.location}</td>
                  <td className="px-4 py-4 text-neutral-600">{vacancy.position || t('notAvailable')}</td>
                  <td className="px-4 py-4 text-neutral-600">{formatSalary(vacancy)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-neutral-600">{new Date(vacancy.publishedAt || vacancy.createdAt).toLocaleDateString(locale)}</td>
                  {isSeeker && <td className="px-4 py-4 text-right"><WishlistToggle vacancyId={vacancy.id} vacancyTitle={vacancy.title} itemId={wishlistByVacancy[vacancy.id]} onChange={(itemId) => updateWishlist(vacancy.id, itemId)} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <nav aria-label={t('pagination')} className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-lg border border-neutral-200 px-4 py-2 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50">{t('previous')}</button>
          {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((page) => (
            <button type="button" key={page} onClick={() => setCurrentPage(page)} aria-current={currentPage === page ? 'page' : undefined} aria-label={t('pageLabel', { page })} className={`rounded-lg px-3 py-2 ${currentPage === page ? 'bg-primary-600 text-white' : 'border border-neutral-200 hover:bg-neutral-50'}`}>{page}</button>
          ))}
          <button type="button" onClick={() => setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))} disabled={currentPage === pagination.totalPages} className="rounded-lg border border-neutral-200 px-4 py-2 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50">{t('next')}</button>
        </nav>
      )}
    </div>
  );
}

function ViewButton({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${active ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
