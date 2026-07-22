'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';

interface WishlistItem {
  id: string;
  vacancy: {
    id: string;
    title: string;
    company: string;
    location: string;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string;
  };
  createdAt: string;
}

export function WishlistList() {
  const t = useTranslations('wishlistUi');
  const locale = useLocale();
  const { showToast } = useToast();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const response = await fetch('/api/wishlist');
        if (!response.ok) throw new Error(t('loadFailed'));
        const result = await response.json();
        setItems(result.data || []);
      } catch (error) {
        console.error('Failed to fetch wishlist:', error);
        setError(t('loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    void loadWishlist();
  }, [t]);

  const handleRemove = async (id: string) => {
    try {
      const response = await fetch(`/api/wishlist/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(t('removeFailed'));
      setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      showToast(t('removeFailed'), 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-48 bg-neutral-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Heart size={48} className="text-neutral-300 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {t('empty')}
        </h3>
        <p className="text-neutral-600 mb-6">
          {t('emptyHint')}
        </p>
        <Link
          href="/jobs"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {t('browse')}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                {item.vacancy.title}
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                {item.vacancy.company}
              </p>
            </div>
            <button
              onClick={() => handleRemove(item.id)}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-neutral-400 hover:text-red-600"
              aria-label={t('remove', { title: item.vacancy.title })}
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="space-y-2 mb-4 text-sm text-neutral-600">
            <p>{item.vacancy.location}</p>
            {item.vacancy.salaryMin && item.vacancy.salaryMax && (
              <p>
                {item.vacancy.currency} {item.vacancy.salaryMin.toLocaleString(locale)} -{' '}
                {item.vacancy.salaryMax.toLocaleString(locale)}
              </p>
            )}
          </div>

          <Link
            href={`/jobs/${item.vacancy.id}`}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            {t('details')}
            <ExternalLink size={16} />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
