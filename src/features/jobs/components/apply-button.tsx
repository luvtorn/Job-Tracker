'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Send } from 'lucide-react';
import { useAuth } from '@/features/auth/context/auth-context';
import { useRouter } from 'next/navigation';

interface ApplyButtonProps {
  vacancyId: string;
  hasApplied?: boolean;
}

export function ApplyButton({ vacancyId, hasApplied = false }: ApplyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [applied, setApplied] = useState(hasApplied);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  const handleApply = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacancyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to submit application');
        return;
      }

      setApplied(true);
      router.refresh();
    } catch (err) {
      console.error('Failed to apply:', err);
      setError('An error occurred while submitting your application');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <motion.button
        onClick={handleApply}
        disabled={applied || isLoading}
        whileHover={!applied && !isLoading ? { scale: 1.02 } : {}}
        whileTap={!applied && !isLoading ? { scale: 0.98 } : {}}
        className="w-full px-8 py-3 rounded-lg font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: applied
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          color: 'white',
        }}
      >
        <motion.div
          className="flex items-center justify-center gap-2"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          key={applied ? 'applied' : 'apply'}
        >
          {applied ? (
            <>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <Check size={20} />
              </motion.div>
              <span>Application Submitted</span>
            </>
          ) : (
            <>
              <motion.div
                animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
              >
                <Send size={20} />
              </motion.div>
              <span>{isLoading ? 'Submitting...' : 'Apply for this position'}</span>
            </>
          )}
        </motion.div>
      </motion.button>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
