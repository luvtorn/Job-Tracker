import assert from 'node:assert/strict';
import test from 'node:test';
import { FixedWindowRateLimiter, isTrustedMutationRequest, resolveRequestOrigin } from './request-security';

test('accepts safe and same-origin requests while rejecting cross-site mutations', () => {
  const requestOrigin = 'https://jobtracker.example';
  assert.equal(isTrustedMutationRequest({ method: 'GET', origin: null, secFetchSite: null, requestOrigin }), true);
  assert.equal(isTrustedMutationRequest({ method: 'POST', origin: requestOrigin, secFetchSite: 'same-origin', requestOrigin }), true);
  assert.equal(isTrustedMutationRequest({ method: 'DELETE', origin: 'https://attacker.example', secFetchSite: 'cross-site', requestOrigin }), false);
  assert.equal(isTrustedMutationRequest({ method: 'PATCH', origin: null, secFetchSite: null, requestOrigin }), false);
});

test('resolves the externally visible origin from trusted proxy headers', () => {
  assert.equal(
    resolveRequestOrigin('http://localhost:3000', '127.0.0.1:3100', null, null),
    'http://127.0.0.1:3100',
  );
  assert.equal(
    resolveRequestOrigin('http://localhost:3000', 'internal:3000', 'jobs.example.com', 'https'),
    'https://jobs.example.com',
  );
});

test('rate limiter resets its fixed window and returns retry timing', () => {
  let now = 1_000;
  const limiter = new FixedWindowRateLimiter(2, 5_000, () => now);
  assert.equal(limiter.consume('client').allowed, true);
  assert.equal(limiter.consume('client').allowed, true);
  assert.deepEqual(limiter.consume('client'), { allowed: false, retryAfterSeconds: 5 });
  now = 6_000;
  assert.equal(limiter.consume('client').allowed, true);
});
