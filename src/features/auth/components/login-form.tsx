"use client";

import { motion, Variants } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading: boolean;
  error: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.42, 0, 0.58, 1], // easeOut bezier
    },
  },
};

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await onSubmit({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
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
      <motion.h2
        variants={itemVariants}
        className="text-2xl font-bold text-neutral-900 mb-2"
      >
        Welcome back
      </motion.h2>

      <motion.p variants={itemVariants} className="text-neutral-600 mb-6">
        Sign in to your account
      </motion.p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-3 text-neutral-400"
              size={18}
            />
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
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-3 text-neutral-400"
              size={18}
            />
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
          </div>
        </motion.div>

        {error && (
          <motion.div
            variants={itemVariants}
            className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          >
            {error}
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
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <>
              <span className="text-white">Sign in</span>
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </form>

      <motion.div
        variants={itemVariants}
        className="my-6 flex items-center gap-3"
      >
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-sm text-neutral-500">New here?</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </motion.div>
    </motion.div>
  );
}
