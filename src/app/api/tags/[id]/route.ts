import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireSeeker } from '@/server/middleware/seeker-auth';
import { workspaceService } from '@/server/services/workspace-service';
import { tagInputSchema, workspaceIdSchema } from '@/server/validators/workspace-validator';
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, { params }: Context) { try { const user = await requireSeeker(); await workspaceService.updateTag(workspaceIdSchema.parse((await params).id), user.id, tagInputSchema.partial().parse(await request.json())); return NextResponse.json({ success: true }); } catch (error) { return handleApiError(error, 'Failed to update tag'); } }
export async function DELETE(_request: NextRequest, { params }: Context) { try { const user = await requireSeeker(); await workspaceService.deleteTag(workspaceIdSchema.parse((await params).id), user.id); return NextResponse.json({ success: true }); } catch (error) { return handleApiError(error, 'Failed to delete tag'); } }
