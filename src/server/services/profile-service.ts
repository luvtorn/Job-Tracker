import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "@/server/config/cloudinary";
import { badRequest } from "@/server/errors/application-error";
import { updateUserAvatar, updateUserProfile } from "@/server/repositories/user-repository";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export const profileService = {
  update(userId: string, data: { firstName: string; lastName: string }) {
    return updateUserProfile(userId, data);
  },
  async uploadAvatar(userId: string, file: File) {
    if (!file.type.startsWith("image/")) throw badRequest("File must be an image");
    if (file.size > MAX_AVATAR_SIZE) throw badRequest("File size must be less than 5MB");
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "job-tracker/avatars", resource_type: "image", quality: "auto", fetch_format: "auto" },
        (error, response) => error || !response ? reject(error ?? new Error("Upload failed")) : resolve(response),
      );
      stream.end(buffer);
    });
    return updateUserAvatar(userId, result.secure_url, result.public_id);
  },
};
