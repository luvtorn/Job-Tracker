'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { MobileHeader } from '@/components/MobileHeader';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <MobileHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}
