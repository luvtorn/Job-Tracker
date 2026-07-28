'use client';

import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';

type WishlistToggleProps = {
  vacancyId: string;
  vacancyTitle: string;
  itemId?: string;
  onChange: (itemId?: string) => void;
};

export function WishlistToggle({
  vacancyId,
  vacancyTitle,
  itemId,
  onChange,
}: WishlistToggleProps) {
  const t = useTranslations('jobs');
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const isSaved = Boolean(itemId);

  const toggle = async () => {
    setIsSaving(true);
    try {
      if (itemId) {
        const response = await fetch(`/api/wishlist/${itemId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(t('favoriteRemoveFailed'));
        onChange(undefined);
        showToast(t('favoriteRemoved'), 'success');
        return;
      }

      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacancyId }),
      });
      const result: { data?: { id: string } } = await response.json();
      if (!response.ok || !result.data?.id) throw new Error(t('favoriteAddFailed'));
      onChange(result.data.id);
      showToast(t('favoriteAdded'), 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('favoriteUpdateFailed'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={isSaving}
      aria-pressed={isSaved}
      aria-label={isSaved ? t('favoriteRemoveLabel', { title: vacancyTitle }) : t('favoriteAddLabel', { title: vacancyTitle })}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-60 ${
        isSaved
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-neutral-200 bg-white text-neutral-500 hover:border-red-200 hover:text-red-600'
      }`}
    >
      {isSaving
        ? <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        : <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />}
    </button>
  );
}
