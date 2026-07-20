import { recruiterStatisticsRepository } from "@/server/repositories/recruiter-statistics-repository";

export type StatisticsPeriod = "30" | "90" | "all";

const STATUSES = ["APPLIED", "INTERVIEWING", "OFFER", "ACCEPTED", "REJECTED", "WITHDRAWN"] as const;
const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};
const STATUS_COLORS: Record<(typeof STATUSES)[number], string> = {
  APPLIED: "#fbbf24",
  INTERVIEWING: "#a78bfa",
  OFFER: "#34d399",
  ACCEPTED: "#10b981",
  REJECTED: "#ef4444",
  WITHDRAWN: "#6b7280",
};

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getSince(period: StatisticsPeriod, now: Date) {
  if (period === "all") return null;
  const since = startOfUtcDay(now);
  since.setUTCDate(since.getUTCDate() - (Number(period) - 1));
  return since;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildTimeline(dates: Date[], period: StatisticsPeriod, now: Date) {
  if (period === "30") {
    const start = getSince(period, now) as Date;
    return Array.from({ length: 30 }, (_, index) => {
      const day = new Date(start);
      day.setUTCDate(day.getUTCDate() + index);
      const key = dateKey(day);
      return { label: key, count: dates.filter((date) => dateKey(date) === key).length };
    });
  }

  if (period === "90") {
    const start = getSince(period, now) as Date;
    return Array.from({ length: 13 }, (_, index) => {
      const bucketStart = new Date(start);
      bucketStart.setUTCDate(bucketStart.getUTCDate() + index * 7);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setUTCDate(bucketEnd.getUTCDate() + (index === 12 ? 6 : 7));
      return {
        label: dateKey(bucketStart),
        count: dates.filter((date) => date >= bucketStart && date < bucketEnd).length,
      };
    });
  }

  if (dates.length === 0) return [];
  const first = new Date(Math.min(...dates.map((date) => date.getTime())));
  const cursor = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const timeline: Array<{ label: string; count: number }> = [];
  while (cursor <= end) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();
    timeline.push({
      label: `${year}-${String(month + 1).padStart(2, "0")}`,
      count: dates.filter((date) => date.getUTCFullYear() === year && date.getUTCMonth() === month).length,
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return timeline;
}

export const recruiterStatisticsService = {
  async getStatistics(recruiterId: string, period: StatisticsPeriod) {
    const now = new Date();
    const vacancies = await recruiterStatisticsRepository.findVacanciesWithApplications(
      recruiterId,
      getSince(period, now),
    );
    const applications = vacancies.flatMap((vacancy) => vacancy.applications);
    const count = (status: (typeof STATUSES)[number]) =>
      applications.filter((application) => application.status === status).length;
    const accepted = count("ACCEPTED");

    return {
      period,
      summary: {
        total: applications.length,
        pending: count("APPLIED"),
        interviewing: count("INTERVIEWING"),
        offers: count("OFFER") + accepted,
        hired: accepted,
      },
      statusDistribution: STATUSES.map((status) => ({
        status,
        name: STATUS_LABELS[status],
        value: count(status),
        fill: STATUS_COLORS[status],
      })),
      applicationsOverTime: buildTimeline(
        applications.map((application) => application.createdAt),
        period,
        now,
      ),
      vacancies: vacancies
        .map((vacancy) => {
          const vacancyCount = (status: (typeof STATUSES)[number]) =>
            vacancy.applications.filter((application) => application.status === status).length;
          const hired = vacancyCount("ACCEPTED");
          return {
            id: vacancy.id,
            title: vacancy.title,
            status: vacancy.status,
            total: vacancy.applications.length,
            pending: vacancyCount("APPLIED"),
            interviewing: vacancyCount("INTERVIEWING"),
            offers: vacancyCount("OFFER") + hired,
            hired,
            rejected: vacancyCount("REJECTED"),
            hireRate: vacancy.applications.length
              ? Math.round((hired / vacancy.applications.length) * 100)
              : 0,
          };
        })
        .sort((left, right) => right.total - left.total),
    };
  },
};
