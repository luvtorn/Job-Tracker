import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/server/validators/auth-validator";
import { authService } from "@/server/services/auth-service";
import { handleApiError } from "@/server/errors/application-error";
import { enforceAuthRateLimit } from '@/server/security/request-security';

export async function POST(request: NextRequest) {
  try {
    enforceAuthRateLimit(request, 'register');
    const user = await authService.register(registerSchema.parse(await request.json()));
    return NextResponse.json({ success: true, message: "Account created successfully", user }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to register user");
  }
}
