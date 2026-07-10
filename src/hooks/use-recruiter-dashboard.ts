'use client';

import { useQuery } from '@tanstack/react-query';

interface DashboardMetrics {
  totalVacancies: number;
  publishedVacancies: number;
  totalCandidates: number;
  pendingReview: number;
  interviewStage: number;
}

interface VacancyWithCandidates {
  id: string;
  title: string;
  company: string;
  location: string;
  status: string;
  totalCandidates: number;
  applied: number;
  interviewing: number;
  offers: number;
  accepted: number;
  rejected: number;
  archivedAt?: string | null;
}

interface RecentApplication {
  id: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
  vacancy: {
    id: string;
    title: string;
    company: string;
  };
}

interface CandidateStage {
  stage: string;
  count: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  vacancies: VacancyWithCandidates[];
  recentApplications: RecentApplication[];
  candidatesByStage: CandidateStage[];
}

export function useRecruiterDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['recruiter-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/recruiter/dashboard/metrics');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
