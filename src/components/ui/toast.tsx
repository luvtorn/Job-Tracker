'use client';

import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: number; message: string; type: ToastType };
type ToastContextValue = { showToast: (message: string, type?: ToastType) => void };

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const toastStyles: Record<ToastType, { icon: typeof CheckCircle2; classes: string }> = {
  success: { icon: CheckCircle2, classes: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  error: { icon: XCircle, classes: 'border-red-200 bg-red-50 text-red-800' },
  info: { icon: Info, classes: 'border-primary-200 bg-primary-50 text-primary-800' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const removeToast = useCallback((id: number) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((currentToasts) => [...currentToasts, { id, message, type }]);
    window.setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const { icon: Icon, classes } = toastStyles[toast.type];
            return (
              <motion.div key={toast.id} initial={{ opacity: 0, x: 32, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 32, scale: 0.96 }} className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg ${classes}`}>
                <Icon size={20} className="mt-0.5 shrink-0" />
                <p className="flex-1 text-sm font-medium leading-5">{toast.message}</p>
                <button type="button" onClick={() => removeToast(toast.id)} aria-label="Close notification" className="rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100"><X size={18} /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
