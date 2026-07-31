const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const getOptionalEnv = (name: string) => process.env[name]?.trim() || undefined;

const requireMinimumBytes = (name: string, value: string, minimum: number) => {
  if (Buffer.byteLength(value, "utf8") < minimum) {
    throw new Error(`${name} must be at least ${minimum} bytes`);
  }
  return value;
};

const getUrlOrigin = (name: string, value: string) => {
  const url = new URL(value);
  if (process.env.VERCEL_ENV === "production" && url.protocol !== "https:") {
    throw new Error(`${name} must use HTTPS in production`);
  }
  return url.origin;
};

export const env = {
  get databaseUrl() {
    return getRequiredEnv("DATABASE_URL");
  },
  get jwtSecret() {
    return requireMinimumBytes("JWT_SECRET", getRequiredEnv("JWT_SECRET"), 32);
  },
  get adminApiKey() {
    return requireMinimumBytes("ADMIN_API_KEY", getRequiredEnv("ADMIN_API_KEY"), 32);
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
    if (value) return getUrlOrigin("APP_URL", value);
    if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
    return getUrlOrigin("APP_URL", getRequiredEnv("APP_URL"));
  },
  get trustedAppOrigins() {
    const configured = getOptionalEnv("TRUSTED_APP_ORIGINS")
      ?.split(",")
      .map((value) => getUrlOrigin("TRUSTED_APP_ORIGINS", value.trim()))
      .filter(Boolean) ?? [];
    const vercelPreview = process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined;
    return new Set([this.appUrl, ...configured, ...(vercelPreview ? [vercelPreview] : [])]);
  },
  get upstashRedisRestUrl() {
    return getOptionalEnv("UPSTASH_REDIS_REST_URL");
  },
  get upstashRedisRestToken() {
    return getOptionalEnv("UPSTASH_REDIS_REST_TOKEN");
  },
  get hasDistributedRateLimit() {
    return Boolean(this.upstashRedisRestUrl && this.upstashRedisRestToken);
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
  get googleCalendarTokenEncryptionKey() {
    return getRequiredEnv("GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY");
  },
  get githubClientId() {
    return getRequiredEnv("GITHUB_CLIENT_ID");
  },
  get githubClientSecret() {
    return getRequiredEnv("GITHUB_CLIENT_SECRET");
  },
};
