'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const statusIcons: Record<string, any> = {
  NEW_APPLICATION: Briefcase,
  APPLICATION_STATUS_CHANGED: TrendingUp,
};

const statusColors: Record<string, string> = {
  NEW_APPLICATION: 'bg-blue-50 border-blue-200 text-blue-600',
  APPLICATION_STATUS_CHANGED: 'bg-purple-50 border-purple-200 text-purple-600',
};

export function RecentActivity() {
  const [activities, setActivities] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/notifications?limit=10');
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      setActivities(data.notifications);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-neutral-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
        <Clock size={32} className="mx-auto text-neutral-400 mb-3" />
        <p className="text-neutral-600">No recent activity</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.05 }}
    >
      {activities.map((activity, idx) => {
        const Icon = statusIcons[activity.type] || Clock;
        const colorClass = statusColors[activity.type] || 'bg-neutral-50 border-neutral-200 text-neutral-600';

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={`border rounded-lg p-4 ${colorClass}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{activity.title}</h4>
                <p className="text-sm opacity-80 mt-0.5 line-clamp-2">{activity.message}</p>
                <p className="text-xs opacity-60 mt-2">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!activity.isRead && (
                <div className="w-2 h-2 rounded-full bg-current opacity-60 mt-1.5 flex-shrink-0" />
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
