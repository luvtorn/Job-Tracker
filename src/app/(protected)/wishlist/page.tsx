import { TopBar } from "@/components/TopBar";
import { WishlistList } from "@/features/wishlist/components/wishlist-list";

export default function WishlistPage() {
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6 bg-neutral-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Wishlist</h1>
          <p className="text-neutral-600 mt-2">
            Your saved job opportunities
          </p>
        </div>

        <WishlistList />
      </main>
    </div>
  );
}
