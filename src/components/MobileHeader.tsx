'use client';

import { Menu } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <div className="flex lg:hidden items-center h-14 px-4 border-b border-neutral-200 bg-white">
      <button
        onClick={onMenuClick}
        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors -ml-2"
      >
        <Menu size={20} className="text-neutral-600" />
      </button>
    </div>
  );
}
