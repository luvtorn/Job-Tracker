import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireSeeker } from '@/server/middleware/seeker-auth';
import { workspaceService } from '@/server/services/workspace-service';
import { reminderInputSchema } from '@/server/validators/workspace-validator';
export async function GET() { try { const user = await requireSeeker(); return NextResponse.json({ success: true, reminders: await workspaceService.listReminders(user.id) }); } catch (error) { return handleApiError(error, 'Failed to list reminders'); } }
export async function POST(request: NextRequest) { try { const user = await requireSeeker(); const reminder = await workspaceService.createReminder(user.id, reminderInputSchema.parse(await request.json())); return NextResponse.json({ success: true, reminder }, { status: 201 }); } catch (error) { return handleApiError(error, 'Failed to create reminder'); } }
