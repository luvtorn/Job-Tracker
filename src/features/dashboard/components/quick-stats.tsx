'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, Briefcase, CheckCircle2, XCircle, Zap } from 'lucide-react';

interface Stats {
  total: number;
  applied: number;
  interviewing: number;
  offers: number;
  accepted: number;
  rejected: number;
}

export function QuickStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/applications/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-neutral-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total',
      value: stats.total,
      icon: FileText,
      color: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Applied',
      value: stats.applied,
      icon: Zap,
      color: 'bg-yellow-50 text-yellow-600',
      borderColor: 'border-yellow-200',
    },
    {
      label: 'Interviewing',
      value: stats.interviewing,
      icon: Clock,
      color: 'bg-purple-50 text-purple-600',
      borderColor: 'border-purple-200',
    },
    {
      label: 'Offers',
      value: stats.offers,
      icon: Briefcase,
      color: 'bg-green-50 text-green-600',
      borderColor: 'border-green-200',
    },
    {
      label: 'Accepted',
      value: stats.accepted,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600',
      borderColor: 'border-emerald-200',
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'bg-red-50 text-red-600',
      borderColor: 'border-red-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`${card.color} rounded-xl p-4 border ${card.borderColor} shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon size={20} />
            </div>
            <div className="text-2xl font-bold mb-1">{stats[card.label.toLowerCase() as keyof Stats]}</div>
            <p className="text-xs font-medium opacity-80">{card.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
