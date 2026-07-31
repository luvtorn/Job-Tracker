import { UploadApiResponse } from "cloudinary";
import { fileTypeFromBuffer } from 'file-type';
import { cloudinary } from "@/server/config/cloudinary";
import { badRequest } from "@/server/errors/application-error";
import { updateUserAvatar, updateUserProfile } from "@/server/repositories/user-repository";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const MAX_AVATAR_DIMENSION = 4096;
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const profileService = {
  update(userId: string, data: { firstName: string; lastName: string }) {
    return updateUserProfile(userId, data);
  },
  async uploadAvatar(userId: string, file: File) {
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      throw badRequest("Only JPEG, PNG, and WebP images are allowed");
    }
    if (file.size > MAX_AVATAR_SIZE) throw badRequest("File size must be less than 5MB");
    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected || detected.mime !== file.type || !ALLOWED_AVATAR_TYPES.has(detected.mime)) {
      throw badRequest("Image content does not match its file type");
    }
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "job-tracker/avatars",
          resource_type: "image",
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [{ width: 512, height: 512, crop: 'limit' }],
        },
        (error, response) => error || !response ? reject(error ?? new Error("Upload failed")) : resolve(response),
      );
      stream.end(buffer);
    });
    if (
      (result.width && result.width > MAX_AVATAR_DIMENSION)
      || (result.height && result.height > MAX_AVATAR_DIMENSION)
    ) {
      await cloudinary.uploader.destroy(result.public_id, { resource_type: 'image' });
      throw badRequest('Image dimensions are too large');
    }
    const safeUrl = cloudinary.url(result.public_id, {
      secure: true,
      width: 512,
      height: 512,
      crop: 'fill',
      gravity: 'face',
      fetch_format: 'auto',
      quality: 'auto',
    });
    return updateUserAvatar(userId, safeUrl, result.public_id);
  },
};
