import { NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireRecruiter } from '@/server/middleware/role-auth';
import { recruiterDashboardService } from '@/server/services/recruiter-dashboard-service';

export async function GET() {
  try {
    const user = await requireRecruiter();
    const dashboard = await recruiterDashboardService.getDashboard(user.id);
    return NextResponse.json({ success: true, ...dashboard });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch recruiter dashboard');
  }
}
