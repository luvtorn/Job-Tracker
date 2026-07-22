import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireRecruiter } from '@/server/middleware/role-auth';
import { vacancyService } from '@/server/services/vacancy-service';
import { resourceIdSchema } from '@/server/validators/jobs-validator';
import { updateVacancySchema } from '@/server/validators/vacancy-validator';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const user = await requireRecruiter();
    const id = resourceIdSchema.parse((await params).id);
    const vacancy = await vacancyService.getVacancyById(id, user.id);
    return NextResponse.json({ success: true, vacancy });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch vacancy');
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const user = await requireRecruiter();
    const id = resourceIdSchema.parse((await params).id);
    const data = updateVacancySchema.parse(await request.json());
    const vacancy = await vacancyService.updateVacancy(user.id, id, data);
    return NextResponse.json({ success: true, vacancy });
  } catch (error) {
    return handleApiError(error, 'Failed to update vacancy');
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const user = await requireRecruiter();
    const id = resourceIdSchema.parse((await params).id);
    await vacancyService.deleteVacancy(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Failed to delete vacancy');
  }
}
