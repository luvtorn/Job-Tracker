import { TopBar } from "@/components/TopBar";

export default function DashboardPage() {
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600 mt-2">Welcome back! 👋</p>
        </div>
      </main>
    </div>
  );
}
