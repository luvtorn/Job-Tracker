import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireSeeker } from '@/server/middleware/seeker-auth';
import { workspaceService } from '@/server/services/workspace-service';
import { companyInputSchema } from '@/server/validators/workspace-validator';

export async function GET() { try { const user = await requireSeeker(); return NextResponse.json({ success: true, companies: await workspaceService.listCompanies(user.id) }); } catch (error) { return handleApiError(error, 'Failed to list companies'); } }
export async function POST(request: NextRequest) { try { const user = await requireSeeker(); const company = await workspaceService.createCompany(user.id, companyInputSchema.parse(await request.json())); return NextResponse.json({ success: true, company }, { status: 201 }); } catch (error) { return handleApiError(error, 'Failed to create company'); } }
