'use client';

import { Menu } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:hidden">
      <button
        onClick={onMenuClick}
        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors -ml-2"
      >
        <Menu size={20} className="text-neutral-600" />
      </button>
      <ThemeSwitcher />
    </div>
  );
}
