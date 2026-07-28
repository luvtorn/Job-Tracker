const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const getOptionalEnv = (name: string) => process.env[name]?.trim() || undefined;

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
  get appUrl() {
    const value = getOptionalEnv("APP_URL") ?? getOptionalEnv("NEXT_PUBLIC_APP_URL");
    if (value) return new URL(value).origin;
    if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
    return getRequiredEnv("APP_URL");
  },
  get resendApiKey() {
    return getOptionalEnv("RESEND_API_KEY");
  },
  get emailFrom() {
    return getOptionalEnv("EMAIL_FROM");
  },
  get googleClientId() {
    return getRequiredEnv("GOOGLE_CLIENT_ID");
  },
  get googleClientSecret() {
    return getRequiredEnv("GOOGLE_CLIENT_SECRET");
  },
  get githubClientId() {
    return getRequiredEnv("GITHUB_CLIENT_ID");
  },
  get githubClientSecret() {
    return getRequiredEnv("GITHUB_CLIENT_SECRET");
  },
};
