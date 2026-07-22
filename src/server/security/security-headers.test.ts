import assert from 'node:assert/strict';
import test from 'node:test';
import { getSecurityHeaders } from './security-headers';

test('production headers restrict framing, MIME sniffing, browser capabilities, and script origins', () => {
  const headers = new Map(getSecurityHeaders(false).map(({ key, value }) => [key, value]));
  assert.equal(headers.get('X-Frame-Options'), 'DENY');
  assert.equal(headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(headers.get('Strict-Transport-Security'), 'max-age=31536000; includeSubDomains');
  assert.match(headers.get('Permissions-Policy') ?? '', /camera=\(\)/);
  assert.match(headers.get('Content-Security-Policy') ?? '', /frame-ancestors 'none'/);
  assert.doesNotMatch(headers.get('Content-Security-Policy') ?? '', /unsafe-eval/);
});

test('development CSP permits only the tooling exceptions needed by the local server', () => {
  const csp = getSecurityHeaders(true).find(({ key }) => key === 'Content-Security-Policy')?.value ?? '';
  assert.match(csp, /unsafe-eval/);
  assert.match(csp, /ws: wss:/);
});
