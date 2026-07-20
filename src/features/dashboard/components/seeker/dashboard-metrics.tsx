'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Clock, CheckCircle2 } from 'lucide-react';

interface Metrics {
  successRate: number;
  responseRate: number;
  averagePerDay: string;
  total: number;
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const response = await fetch('/api/applications/stats');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        setMetrics({
          successRate: data.metrics.successRate,
          responseRate: data.metrics.responseRate,
          averagePerDay: data.metrics.averagePerDay,
          total: data.stats.total,
        });
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadMetrics();
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-neutral-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Success Rate',
      value: `${metrics.successRate}%`,
      icon: Target,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      description: 'Offers & Accepted',
    },
    {
      label: 'Response Rate',
      value: `${metrics.responseRate}%`,
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      description: 'Recruiter responses',
    },
    {
      label: 'Avg/Day',
      value: metrics.averagePerDay,
      icon: Clock,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      description: 'Applications per day',
    },
    {
      label: 'Total',
      value: metrics.total,
      icon: CheckCircle2,
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      description: 'All applications',
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {metricCards.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -2 }}
            className={`${metric.color} border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon size={24} />
            </div>
            <div className="text-3xl font-bold mb-1">{metric.value}</div>
            <p className="text-sm font-medium opacity-80 mb-1">{metric.label}</p>
            <p className="text-xs opacity-60">{metric.description}</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
