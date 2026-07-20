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

interface ChartsData {
  statusDistribution: Array<{ name: string; value: number; fill: string }>;
  applicationsByDate: Array<{ date: string; count: number }>;
}

export function DashboardCharts() {
  const [data, setData] = useState<ChartsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCharts = async () => {
      try {
        const response = await fetch('/api/applications/stats');
        if (!response.ok) throw new Error('Failed to fetch charts');
        const result = await response.json();
        setData({
          statusDistribution: result.statusDistribution,
          applicationsByDate: result.applicationsByDate,
        });
      } catch (error) {
        console.error('Failed to fetch charts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadCharts();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-80 bg-neutral-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status Distribution Pie Chart */}
      <motion.div
        className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm"
        initial="hidden"
        animate="visible"
        variants={itemVariants}
      >
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Application Status
        </h3>
        {data.statusDistribution.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.statusDistribution}
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
            No applications yet
          </div>
        )}
      </motion.div>

      {/* Timeline Bar Chart */}
      <motion.div
        className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm"
        initial="hidden"
        animate="visible"
        variants={itemVariants}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Applications Timeline (Last 14 Days)
        </h3>
        {data.applicationsByDate.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.applicationsByDate.slice(-14)}
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
            No applications yet
          </div>
        )}
      </motion.div>
    </div>
  );
}
