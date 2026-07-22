'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingUp, Target, Clock, CheckCircle2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface StatsData {
  stats: {
    total: number;
    applied: number;
    interviewing: number;
    offers: number;
    accepted: number;
    rejected: number;
  };
  statusDistribution: Array<{ status: string; name: string; value: number; fill: string }>;
  applicationsByDate: Array<{ date: string; count: number }>;
  metrics: {
    successRate: number;
    responseRate: number;
    averagePerDay: string;
  };
}

export function StatisticsCharts() {
  const t = useTranslations('statisticsUi');
  const common = useTranslations('common');
  const statusT = useTranslations('statuses');
  const locale = useLocale();
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/applications/stats');
        if (!response.ok) throw new Error(t('loadFailed'));
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setError(t('loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    void loadStats();
  }, [t]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-80 bg-neutral-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">{error || t('loadFailed')}<button onClick={() => window.location.reload()} className="ml-3 font-semibold underline">{common('tryAgain')}</button></div>;
  }

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

  const metricCards = [
    {
      label: t('successRate'),
      value: `${data.metrics.successRate}%`,
      icon: Target,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      description: t('offersAccepted'),
    },
    {
      label: t('responseRate'),
      value: `${data.metrics.responseRate}%`,
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      description: t('nonAppliedStatus'),
    },
    {
      label: t('averagePerDay'),
      value: data.metrics.averagePerDay,
      icon: Clock,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      description: t('dailyAverage'),
    },
    {
      label: t('totalApplications'),
      value: data.stats.total,
      icon: CheckCircle2,
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      description: t('allTime'),
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Metric Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={itemVariants}
      >
        {metricCards.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={idx}
              className={`${metric.color} border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow`}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon size={24} />
              </div>
              <div className="text-2xl font-bold mb-1">{metric.value}</div>
              <p className="text-sm font-medium opacity-80 mb-1">{metric.label}</p>
              <p className="text-xs opacity-60">{metric.description}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <motion.div
          className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm"
          variants={itemVariants}
        >
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            {t('applicationDistribution')}
          </h3>
          {data.statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.statusDistribution.map((item) => ({ ...item, name: statusT(item.status.toLowerCase() as 'applied' | 'interviewing' | 'offer' | 'accepted' | 'rejected') }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-neutral-500">
              {t('noData')}
            </div>
          )}
        </motion.div>

        {/* Timeline Bar Chart */}
        <motion.div
          className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm"
          variants={itemVariants}
        >
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            {t('timeline')}
          </h3>
          {data.applicationsByDate.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.applicationsByDate.slice(-14).map((item) => ({ ...item, date: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${item.date}T00:00:00Z`)) }))}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-neutral-500">
              {t('noData')}
            </div>
          )}
        </motion.div>
      </div>

      {/* Detailed Stats Table */}
      <motion.div
        className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm"
        variants={itemVariants}
      >
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          {t('detailed')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: t('total'), value: data.stats.total, color: 'bg-blue-50' },
            { label: t('applied'), value: data.stats.applied, color: 'bg-yellow-50' },
            { label: t('interviewing'), value: data.stats.interviewing, color: 'bg-purple-50' },
            { label: t('offers'), value: data.stats.offers, color: 'bg-green-50' },
            { label: t('accepted'), value: data.stats.accepted, color: 'bg-emerald-50' },
            { label: t('rejected'), value: data.stats.rejected, color: 'bg-red-50' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              className={`${stat.color} rounded-lg p-4 text-center border border-neutral-200`}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-2xl font-bold text-neutral-900 mb-1">
                {stat.value}
              </div>
              <p className="text-sm text-neutral-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
