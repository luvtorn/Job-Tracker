'use client';

import { motion } from 'framer-motion';
import { Mail, Lock, Check, X } from 'lucide-react';
import { useState } from 'react';
import type { UserRole } from '@/types/auth';

interface RegisterFormProps {
  role: UserRole;
  onBack: () => void;
  onSubmit: (data: RegisterFormData) => Promise<void>;
  isLoading: boolean;
  error: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
];

function PasswordRequirementItem({
  requirement,
  password,
}: {
  requirement: PasswordRequirement;
  password: string;
}) {
  const isMet = requirement.test(password);

  return (
    <div className="flex items-center gap-2 text-sm">
      {isMet ? (
        <Check size={16} className="text-green-600" />
      ) : (
        <X size={16} className="text-neutral-300" />
      )}
      <span className={isMet ? 'text-green-600' : 'text-neutral-600'}>
        {requirement.label}
      </span>
    </div>
  );
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export function RegisterForm({
  role,
  onBack,
  onSubmit,
  isLoading,
  error,
}: RegisterFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const allRequirementsMet = PASSWORD_REQUIREMENTS.every((req) => req.test(password));
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;

    if (!firstName.trim() || !lastName.trim()) {
      setFormError('Please fill in all fields');
      return;
    }

    if (!allRequirementsMet) {
      setFormError('Password does not meet requirements');
      return;
    }

    if (!passwordsMatch) {
      setFormError('Passwords do not match');
      return;
    }

    await onSubmit({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    });
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
      }}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-xl shadow-lg p-8 border border-neutral-200"
    >
      <motion.button
        variants={itemVariants}
        onClick={onBack}
        className="text-primary-600 hover:text-primary-700 text-sm font-medium mb-4 inline-flex items-center gap-1"
      >
        ← Back
      </motion.button>

      <motion.h2 variants={itemVariants} className="text-2xl font-bold text-neutral-900 mb-2">
        Create your account
      </motion.h2>

      <motion.p variants={itemVariants} className="text-neutral-600 mb-6">
        As a {role === 'SEEKER' ? 'Job Seeker' : 'Recruiter'}
      </motion.p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              First name
            </label>
            <input
              type="text"
              name="firstName"
              placeholder="John"
              required
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Last name
            </label>
            <input
              type="text"
              name="lastName"
              placeholder="Doe"
              required
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-neutral-400" size={18} />
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-neutral-400" size={18} />
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
          </div>

          {password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 space-y-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200"
            >
              {PASSWORD_REQUIREMENTS.map((req) => (
                <PasswordRequirementItem
                  key={req.label}
                  requirement={req}
                  password={password}
                />
              ))}
            </motion.div>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-neutral-400" size={18} />
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
          </div>

          {password && confirmPassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 flex items-center gap-2 text-sm"
            >
              {passwordsMatch ? (
                <>
                  <Check size={16} className="text-green-600" />
                  <span className="text-green-600">Passwords match</span>
                </>
              ) : (
                <>
                  <X size={16} className="text-red-600" />
                  <span className="text-red-600">Passwords do not match</span>
                </>
              )}
            </motion.div>
          )}
        </motion.div>

        {(error || formError) && (
          <motion.div
            variants={itemVariants}
            className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          >
            {error || formError}
          </motion.div>
        )}

        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <span className="text-white">Create account</span>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
