import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-neutral-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600 mb-2">404</h1>
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">{t('title')}</h2>
          <p className="text-neutral-600 text-lg mb-8">
            {t('description')}
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            <Home size={20} />
            {t('dashboard')}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-semibold py-3 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            {t('home')}
          </Link>
        </div>

      </div>
    </div>
  );
}
