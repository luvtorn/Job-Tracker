import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireSeeker } from '@/server/middleware/seeker-auth';
import { workspaceService } from '@/server/services/workspace-service';
import { applicationTagInputSchema } from '@/server/validators/workspace-validator';
export async function POST(request: NextRequest) { try { const user = await requireSeeker(); const data = applicationTagInputSchema.parse(await request.json()); await workspaceService.attachTag(user.id, data.applicationId, data.tagId); return NextResponse.json({ success: true }, { status: 201 }); } catch (error) { return handleApiError(error, 'Failed to attach tag'); } }
export async function DELETE(request: NextRequest) { try { const user = await requireSeeker(); const data = applicationTagInputSchema.parse(await request.json()); await workspaceService.detachTag(user.id, data.applicationId, data.tagId); return NextResponse.json({ success: true }); } catch (error) { return handleApiError(error, 'Failed to detach tag'); } }
