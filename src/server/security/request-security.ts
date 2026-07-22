import { tooManyRequests } from '@/server/errors/application-error';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const MAX_RATE_LIMIT_KEYS = 10_000;

type RequestMetadata = {
  method: string;
  origin: string | null;
  secFetchSite: string | null;
  requestOrigin: string;
};

export const isTrustedMutationRequest = ({
  method,
  origin,
  secFetchSite,
  requestOrigin,
}: RequestMetadata) => {
  if (SAFE_METHODS.has(method.toUpperCase())) return true;
  if (secFetchSite === 'cross-site') return false;
  if (origin) return origin === requestOrigin;
  return secFetchSite === 'same-origin';
};

export const resolveRequestOrigin = (
  fallbackOrigin: string,
  host: string | null,
  forwardedHost: string | null,
  forwardedProto: string | null,
) => {
  const resolvedHost = forwardedHost?.split(',')[0]?.trim() || host;
  if (!resolvedHost) return fallbackOrigin;
  const fallbackProtocol = new URL(fallbackOrigin).protocol.replace(':', '');
  const protocol = forwardedProto?.split(',')[0]?.trim() || fallbackProtocol;
  return `${protocol}://${resolvedHost}`;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export class FixedWindowRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  consume(key: string) {
    const currentTime = this.now();
    const entry = this.entries.get(key);

    if (!entry || entry.resetAt <= currentTime) {
      this.prune(currentTime);
      this.entries.set(key, { count: 1, resetAt: currentTime + this.windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (entry.count >= this.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1000)),
      };
    }

    entry.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
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

const authLimiter = new FixedWindowRateLimiter(10, 60_000);
const uploadLimiter = new FixedWindowRateLimiter(20, 60 * 60_000);

const getClientKey = (request: Request) => {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || request.headers.get('x-real-ip') || 'unknown';
};

const enforceLimit = (request: Request, limiter: FixedWindowRateLimiter, scope: string) => {
  const result = limiter.consume(`${scope}:${getClientKey(request)}`);
  if (!result.allowed) throw tooManyRequests(result.retryAfterSeconds);
};

export const enforceAuthRateLimit = (request: Request, action: string) =>
  enforceLimit(request, authLimiter, `auth:${action}`);

export const enforceUploadRateLimit = (request: Request) =>
  enforceLimit(request, uploadLimiter, 'upload');
