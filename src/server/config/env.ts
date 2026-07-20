const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  get databaseUrl() {
    return getRequiredEnv("DATABASE_URL");
  },
  get jwtSecret() {
    return getRequiredEnv("JWT_SECRET");
  },
  get adminApiKey() {
    return getRequiredEnv("ADMIN_API_KEY");
  },
  get cloudinaryCloudName() {
    const value = getRequiredEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
    if (value.includes("://")) throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME must contain only the Cloudinary cloud name");
    return value;
  },
  get cloudinaryApiKey() {
    return getRequiredEnv("CLOUDINARY_API_KEY");
  },
  get cloudinaryApiSecret() {
    return getRequiredEnv("CLOUDINARY_API_SECRET");
  },
};
