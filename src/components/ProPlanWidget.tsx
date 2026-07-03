'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ProPlanWidget() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isAnimating
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div className="relative w-64 bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-6 text-white shadow-xl border border-slate-800">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">👑</span>
          <h3 className="text-lg font-semibold">Pro Plan</h3>
        </div>

        <p className="text-slate-300 text-sm mb-4">
          Unlock advanced features and analytics.
        </p>

        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}
