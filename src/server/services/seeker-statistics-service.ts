import { applicationRepository } from "@/server/repositories/application-repository";

export const seekerStatisticsService = {
  async getStatistics(userId: string) {
    const applications = await applicationRepository.findStatsByUser(userId);
    const count = (status: string) => applications.filter((application) => application.status === status).length;
    const stats = {
      total: applications.length,
      applied: count("APPLIED"),
      interviewing: count("INTERVIEWING"),
      offers: count("OFFER"),
      accepted: count("ACCEPTED"),
      rejected: count("REJECTED"),
    };
    const statusDistribution = [
      { status: "APPLIED", name: "Applied", value: stats.applied, fill: "#fbbf24" },
      { status: "INTERVIEWING", name: "Interviewing", value: stats.interviewing, fill: "#a78bfa" },
      { status: "OFFER", name: "Offers", value: stats.offers, fill: "#34d399" },
      { status: "ACCEPTED", name: "Accepted", value: stats.accepted, fill: "#10b981" },
      { status: "REJECTED", name: "Rejected", value: stats.rejected, fill: "#ef4444" },
    ].filter((item) => item.value > 0);
    const countsByDate = new Map<string, number>();
    for (const application of applications) {
      const date = application.createdAt.toISOString().split("T")[0];
      countsByDate.set(date, (countsByDate.get(date) ?? 0) + 1);
    }
    const applicationsByDate = Array.from(countsByDate, ([date, countValue]) => ({ date, count: countValue }));
    return {
      stats,
      statusDistribution,
      applicationsByDate,
      metrics: {
        successRate: stats.total ? Math.round(((stats.accepted + stats.offers) / stats.total) * 100) : 0,
        responseRate: stats.total ? Math.round(((stats.total - stats.applied) / stats.total) * 100) : 0,
        averagePerDay: stats.total ? (stats.total / Math.max(applicationsByDate.length, 1)).toFixed(1) : 0,
      },
    };
  },
};
