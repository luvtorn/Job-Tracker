'use client';
import { useTranslations } from 'next-intl';
import { TopBar } from "@/components/TopBar";
import { WishlistList } from "@/features/wishlist/components/wishlist-list";

export default function WishlistPage() {
  const t = useTranslations('pages');
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6 bg-neutral-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">{t('wishlistTitle')}</h1>
          <p className="text-neutral-600 mt-2">
            {t('wishlistDescription')}
          </p>
        </div>

        <WishlistList />
      </main>
    </div>
  );
}
