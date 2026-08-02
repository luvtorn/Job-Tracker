import { createHmac } from 'node:crypto';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '@/server/config/env';
import { serviceUnavailable, tooManyRequests } from '@/server/errors/application-error';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const MAX_RATE_LIMIT_KEYS = 10_000;

type RequestMetadata = {
  method: string;
  origin: string | null;
  secFetchSite: string | null;
  allowedOrigins: ReadonlySet<string>;
};

export const isTrustedMutationRequest = ({
  method,
  origin,
  secFetchSite,
  allowedOrigins,
}: RequestMetadata) => {
  if (SAFE_METHODS.has(method.toUpperCase())) return true;
  if (secFetchSite === 'cross-site') return false;
  if (!origin) return secFetchSite === 'same-origin';
  try {
    return allowedOrigins.has(new URL(origin).origin);
  } catch {
    return false;
  }
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export class FixedWindowRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  consume(key: string): RateLimitResult {
    const currentTime = this.now();
    const entry = this.entries.get(key);

    if (!entry || entry.resetAt <= currentTime) {
      this.prune(currentTime);
      this.entries.set(key, { count: 1, resetAt: currentTime + this.windowMs });
      return {
        allowed: true,
        limit: this.limit,
        remaining: Math.max(0, this.limit - 1),
        retryAfterSeconds: 0,
      };
    }

    if (entry.count >= this.limit) {
      return {
        allowed: false,
        limit: this.limit,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1000)),
      };
    }

    entry.count += 1;
    return {
      allowed: true,
      limit: this.limit,
      remaining: Math.max(0, this.limit - entry.count),
      retryAfterSeconds: 0,
    };
  }

  private prune(currentTime: number) {
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= currentTime) this.entries.delete(key);
    }
    if (this.entries.size >= MAX_RATE_LIMIT_KEYS) {
      const oldestKey = this.entries.keys().next().value as string | undefined;
      if (oldestKey) this.entries.delete(oldestKey);
    }
  }
}

type RateLimitPolicy = {
  limit: number;
  windowSeconds: number;
  failClosed: boolean;
};

const AUTH_POLICIES: Record<string, RateLimitPolicy> = {
  login: { limit: 10, windowSeconds: 10 * 60, failClosed: true },
  register: { limit: 5, windowSeconds: 60 * 60, failClosed: true },
  'forgot-password': { limit: 3, windowSeconds: 60 * 60, failClosed: true },
  'reset-password': { limit: 3, windowSeconds: 60 * 60, failClosed: true },
  'resend-verification': { limit: 3, windowSeconds: 60 * 60, failClosed: true },
  'oauth-start': { limit: 20, windowSeconds: 10 * 60, failClosed: true },
  'change-password': { limit: 5, windowSeconds: 60 * 60, failClosed: true },
};
const DEFAULT_AUTH_POLICY: RateLimitPolicy = {
  limit: 20,
  windowSeconds: 10 * 60,
  failClosed: true,
};
const UPLOAD_POLICY: RateLimitPolicy = {
  limit: 10,
  windowSeconds: 60 * 60,
  failClosed: true,
};
const PUBLIC_READ_POLICY: RateLimitPolicy = {
  limit: 120,
  windowSeconds: 60,
  failClosed: false,
};

const memoryLimiters = new Map<string, FixedWindowRateLimiter>();
const distributedLimiters = new Map<string, Ratelimit>();

const getClientAddress = (request: Request) => {
  if (process.env.VERCEL === '1') {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
};

const fingerprint = (value: string) =>
  createHmac('sha256', env.jwtSecret).update(value.trim().toLowerCase()).digest('hex');

const getMemoryLimiter = (scope: string, policy: RateLimitPolicy) => {
  const key = `${scope}:${policy.limit}:${policy.windowSeconds}`;
  const existing = memoryLimiters.get(key);
  if (existing) return existing;
  const limiter = new FixedWindowRateLimiter(policy.limit, policy.windowSeconds * 1000);
  memoryLimiters.set(key, limiter);
  return limiter;
};

const getDistributedLimiter = (scope: string, policy: RateLimitPolicy) => {
  const key = `${scope}:${policy.limit}:${policy.windowSeconds}`;
  const existing = distributedLimiters.get(key);
  if (existing) return existing;
  if (!env.upstashRedisRestUrl || !env.upstashRedisRestToken) return null;
  const limiter = new Ratelimit({
    redis: new Redis({
      url: env.upstashRedisRestUrl,
      token: env.upstashRedisRestToken,
    }),
    limiter: Ratelimit.slidingWindow(policy.limit, `${policy.windowSeconds} s`),
    prefix: `jobtracker:ratelimit:${scope}`,
    analytics: false,
    timeout: 1_000,
  });
  distributedLimiters.set(key, limiter);
  return limiter;
};

const consume = async (
  scope: string,
  identifier: string,
  policy: RateLimitPolicy,
): Promise<RateLimitResult> => {
  const distributed = getDistributedLimiter(scope, policy);
  if (!distributed) {
    if (process.env.VERCEL_ENV === 'production' && policy.failClosed) {
      throw serviceUnavailable('Security service unavailable');
    }
    return getMemoryLimiter(scope, policy).consume(identifier);
  }

  try {
    const result = await distributed.limit(identifier);
    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      retryAfterSeconds: result.success
        ? 0
        : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  } catch {
    if (policy.failClosed) throw serviceUnavailable('Security service unavailable');
    return {
      allowed: true,
      limit: policy.limit,
      remaining: policy.limit,
      retryAfterSeconds: 0,
    };
  }
};

const enforce = async (
  request: Request,
  scope: string,
  policy: RateLimitPolicy,
  identity?: string,
) => {
  const address = fingerprint(getClientAddress(request));
  const identifiers = [address];
  if (identity) identifiers.push(`${address}:${fingerprint(identity)}`);

  for (const identifier of identifiers) {
    const result = await consume(scope, identifier, policy);
    if (!result.allowed) {
      throw tooManyRequests(result.retryAfterSeconds, result.limit, result.remaining);
    }
  }
};

export const enforceAuthRateLimit = (
  request: Request,
  action: string,
  identity?: string,
) => enforce(request, `auth:${action}`, AUTH_POLICIES[action] ?? DEFAULT_AUTH_POLICY, identity);

export const enforceUploadRateLimit = (
  request: Request,
  userId?: string,
) => enforce(request, 'upload', UPLOAD_POLICY, userId);

export const enforcePublicReadRateLimit = (
  request: Request,
  resource: string,
) => enforce(request, `public:${resource}`, PUBLIC_READ_POLICY);
