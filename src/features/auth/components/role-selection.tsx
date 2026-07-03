"use client";

import { motion, Variants } from "framer-motion";
import { Building2, Users } from "lucide-react";
import type { UserRole } from "@/types/auth";

interface RoleSelectionProps {
  onSelect: (role: UserRole) => void;
}

export function RoleSelection({ onSelect }: RoleSelectionProps) {
  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
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
      className="space-y-4"
    >
      <motion.h2
        variants={itemVariants}
        className="text-2xl font-bold text-neutral-900 text-center mb-6"
      >
        Who are you?
      </motion.h2>

      <motion.button
        variants={itemVariants}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect("SEEKER")}
        className="w-full p-6 rounded-xl border-2 border-neutral-200 hover:border-primary-500 transition-all bg-white hover:bg-primary-50 text-left"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users size={24} className="text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 mb-1">Job Seeker</h3>
            <p className="text-sm text-neutral-600">
              Looking for new opportunities
            </p>
          </div>
        </div>
      </motion.button>

      <motion.button
        variants={itemVariants}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect("RECRUITER")}
        className="w-full p-6 rounded-xl border-2 border-neutral-200 hover:border-primary-500 transition-all bg-white hover:bg-primary-50 text-left"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 size={24} className="text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 mb-1">Recruiter</h3>
            <p className="text-sm text-neutral-600">Hiring great talent</p>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}
