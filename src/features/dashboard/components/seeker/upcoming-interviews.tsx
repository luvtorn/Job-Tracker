'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';

interface Application {
  id: string;
  status: string;
  createdAt: string;
  vacancy: {
    id: string;
    title: string;
    company: string;
    location: string;
    position: string;
  };
}

export function UpcomingInterviews() {
  const [interviews, setInterviews] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await fetch('/api/applications?status=INTERVIEWING');
      if (!response.ok) throw new Error('Failed to fetch interviews');
      const data = await response.json();
      setInterviews(data.applications.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-neutral-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
        <Calendar size={32} className="mx-auto text-neutral-400 mb-3" />
        <p className="text-neutral-600">No upcoming interviews scheduled</p>
        <p className="text-sm text-neutral-500 mt-1">Keep applying to get interview invites!</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {interviews.map((interview, idx) => (
        <motion.div
          key={interview.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-neutral-900">{interview.vacancy.company}</h4>
              <p className="text-sm text-neutral-600 mt-1">{interview.vacancy.title}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-neutral-500">
                {interview.vacancy.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    {interview.vacancy.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                    Interview
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={`/applications`}
              className="ml-4 px-3 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium whitespace-nowrap"
            >
              View
            </Link>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
