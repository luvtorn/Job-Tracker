'use client';

import { motion } from 'framer-motion';
import { Briefcase, Users, Clock, CheckCircle2 } from 'lucide-react';

interface RecruiterMetricsData {
  totalVacancies: number;
  publishedVacancies: number;
  totalCandidates: number;
  pendingReview: number;
  interviewStage: number;
}

interface RecruiterMetricsProps {
  metrics: RecruiterMetricsData;
}

export function RecruiterMetrics({ metrics }: RecruiterMetricsProps) {
  const metricCards = [
    {
      label: 'Published Vacancies',
      value: metrics.publishedVacancies,
      icon: Briefcase,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      description: 'Active job postings',
    },
    {
      label: 'Total Candidates',
      value: metrics.totalCandidates,
      icon: Users,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      description: 'All applications',
    },
    {
      label: 'Pending Review',
      value: metrics.pendingReview,
      icon: Clock,
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      description: 'Awaiting your action',
    },
    {
      label: 'Interview Stage',
      value: metrics.interviewStage,
      icon: CheckCircle2,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      description: 'In progress',
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
