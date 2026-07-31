import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FixedWindowRateLimiter,
  isTrustedMutationRequest,
} from './request-security';

test('accepts safe and allowlisted origins while rejecting cross-site mutations', () => {
  const allowedOrigins = new Set(['https://jobtracker.example']);
  assert.equal(isTrustedMutationRequest({
    method: 'GET',
    origin: null,
    secFetchSite: null,
    allowedOrigins,
  }), true);
  assert.equal(isTrustedMutationRequest({
    method: 'POST',
    origin: 'https://jobtracker.example',
    secFetchSite: 'same-origin',
    allowedOrigins,
  }), true);
  assert.equal(isTrustedMutationRequest({
    method: 'DELETE',
    origin: 'https://attacker.example',
    secFetchSite: 'cross-site',
    allowedOrigins,
  }), false);
  assert.equal(isTrustedMutationRequest({
    method: 'PATCH',
    origin: null,
    secFetchSite: null,
    allowedOrigins,
  }), false);
});

test('does not trust forwarded hosts when checking a mutation origin', () => {
  const allowedOrigins = new Set(['https://jobtracker.example']);
  assert.equal(isTrustedMutationRequest({
    method: 'POST',
    origin: 'https://spoofed.example',
    secFetchSite: 'same-site',
    allowedOrigins,
  }), false);
});

test('rate limiter resets its fixed window and returns retry timing', () => {
  let now = 1_000;
  const limiter = new FixedWindowRateLimiter(2, 5_000, () => now);
  assert.equal(limiter.consume('client').allowed, true);
  assert.equal(limiter.consume('client').allowed, true);
  assert.deepEqual(limiter.consume('client'), {
    allowed: false,
    limit: 2,
    remaining: 0,
    retryAfterSeconds: 5,
  });
  now = 6_000;
  assert.equal(limiter.consume('client').allowed, true);
});
