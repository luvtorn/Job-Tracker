import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/server/errors/application-error';
import { requireRecruiter } from '@/server/middleware/role-auth';
import { recruiterStatisticsService } from '@/server/services/recruiter-statistics-service';

const statisticsQuerySchema = z.object({
  period: z.enum(['30', '90', 'all']).default('30'),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const user = await requireRecruiter();
    const { period } = statisticsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const statistics = await recruiterStatisticsService.getStatistics(user.id, period);
    return NextResponse.json({ success: true, ...statistics });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch recruiter statistics');
  }
}
