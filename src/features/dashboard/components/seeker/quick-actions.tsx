'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Heart, Briefcase } from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      label: 'Browse Jobs',
      description: 'Find new opportunities',
      icon: Briefcase,
      href: '/jobs',
      color: 'from-blue-50 to-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'View Wishlist',
      description: 'Your saved jobs',
      icon: Heart,
      href: '/wishlist',
      color: 'from-red-50 to-red-100',
      iconColor: 'text-red-600',
    },
    {
      label: 'My Applications',
      description: 'Track your progress',
      icon: Plus,
      href: '/applications',
      color: 'from-purple-50 to-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <Link key={idx} href={action.href}>
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`bg-gradient-to-br ${action.color} rounded-xl p-6 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 bg-white rounded-lg ${action.iconColor}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">{action.label}</h3>
                  <p className="text-sm text-neutral-600">{action.description}</p>
                </div>
              </div>
            </motion.div>
          </Link>
        );
      })}
    </motion.div>
  );
}
