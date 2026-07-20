'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Loader2, X } from 'lucide-react';

type ConfirmationDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  variant = 'default',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmationDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    confirmButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isLoading, isOpen, onClose]);

  const close = () => {
    if (!isLoading) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) close();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-dialog-title"
            aria-describedby="confirmation-dialog-description"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${variant === 'destructive' ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-600'}`}>
                <AlertTriangle size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="confirmation-dialog-title" className="text-lg font-bold text-neutral-900">{title}</h2>
                <p id="confirmation-dialog-description" className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
              </div>
              <button type="button" onClick={close} disabled={isLoading} aria-label="Close dialog" className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50">
                <X size={20} />
              </button>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={close} disabled={isLoading} className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50">
                Cancel
              </button>
              <button ref={confirmButtonRef} type="button" onClick={onConfirm} disabled={isLoading} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'}`}>
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
