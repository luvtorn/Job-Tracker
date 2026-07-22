import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/server/middleware/auth";
import { badRequest, handleApiError } from "@/server/errors/application-error";
import { profileService } from "@/server/services/profile-service";
import { enforceUploadRateLimit } from '@/server/security/request-security';

export async function POST(request: NextRequest) {
  try {
    enforceUploadRateLimit(request);
    const currentUser = await verifyAuth();
    if (!currentUser) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) throw badRequest("No file provided");
    const user = await profileService.uploadAvatar(currentUser.id, file);
    return NextResponse.json({ success: true, user, message: "Avatar uploaded successfully" }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "Failed to upload avatar");
  }
}
