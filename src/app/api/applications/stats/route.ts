import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/server/middleware/auth";

export async function GET() {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      select: { status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const stats = {
      total: applications.length,
      applied: applications.filter((a) => a.status === "APPLIED").length,
      interviewing: applications.filter((a) => a.status === "INTERVIEWING").length,
      offers: applications.filter((a) => a.status === "OFFER").length,
      accepted: applications.filter((a) => a.status === "ACCEPTED").length,
      rejected: applications.filter((a) => a.status === "REJECTED").length,
    };

    const statusDistribution = [
      { name: 'Applied', value: stats.applied, fill: '#fbbf24' },
      { name: 'Interviewing', value: stats.interviewing, fill: '#a78bfa' },
      { name: 'Offers', value: stats.offers, fill: '#34d399' },
      { name: 'Accepted', value: stats.accepted, fill: '#10b981' },
      { name: 'Rejected', value: stats.rejected, fill: '#ef4444' },
    ].filter(item => item.value > 0);

    const applicationsByDate = applications.reduce((acc, app) => {
      const date = new Date(app.createdAt).toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, [] as { date: string; count: number }[]);

    const successRate = stats.total > 0
      ? Math.round(((stats.accepted + stats.offers) / stats.total) * 100)
      : 0;

    const responseRate = stats.total > 0
      ? Math.round(((stats.total - stats.applied) / stats.total) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      stats,
      statusDistribution,
      applicationsByDate,
      metrics: {
        successRate,
        responseRate,
        averagePerDay: stats.total > 0 ? (stats.total / Math.max(applicationsByDate.length, 1)).toFixed(1) : 0,
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch application stats:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
