import { TopBar } from "@/components/TopBar";
import { ProfileCard } from "@/features/profile/components/profile-card";

export default function ProfilePage() {
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Profile</h1>
          <p className="text-neutral-600 mt-2">Manage your account settings and information</p>
        </div>
        <ProfileCard />
      </main>
    </div>
  );
}
