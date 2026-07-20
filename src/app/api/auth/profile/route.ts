import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/server/middleware/auth";
import { updateProfileSchema } from "@/server/validators/profile-validator";
import { profileService } from "@/server/services/profile-service";
import { handleApiError } from "@/server/errors/application-error";

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await verifyAuth();
    if (!currentUser) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const user = await profileService.update(currentUser.id, updateProfileSchema.parse(await request.json()));
    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "Failed to update profile");
  }
}
