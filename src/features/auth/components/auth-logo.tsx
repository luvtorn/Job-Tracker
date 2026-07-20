'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface AuthLogoProps {
  subtitle?: string;
}

export function AuthLogo({ subtitle }: AuthLogoProps) {
  const t = useTranslations('auth');
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center mb-8"
    >
      <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-lg mb-4">
        <span className="text-2xl text-white font-bold">J</span>
      </div>
      <h1 className="text-3xl font-bold text-neutral-900">JobTracker</h1>
      <p className="text-neutral-600 mt-2">{subtitle || t('join')}</p>
    </motion.div>
  );
}
