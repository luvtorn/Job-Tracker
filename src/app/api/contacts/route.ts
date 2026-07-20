import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireSeeker } from '@/server/middleware/seeker-auth';
import { workspaceService } from '@/server/services/workspace-service';
import { contactInputSchema } from '@/server/validators/workspace-validator';
export async function GET() { try { const user = await requireSeeker(); return NextResponse.json({ success: true, contacts: await workspaceService.listContacts(user.id) }); } catch (error) { return handleApiError(error, 'Failed to list contacts'); } }
export async function POST(request: NextRequest) { try { const user = await requireSeeker(); const contact = await workspaceService.createContact(user.id, contactInputSchema.parse(await request.json())); return NextResponse.json({ success: true, contact }, { status: 201 }); } catch (error) { return handleApiError(error, 'Failed to create contact'); } }
