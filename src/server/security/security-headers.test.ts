import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildContentSecurityPolicy,
  getSecurityHeaders,
} from './security-headers';

test('production headers restrict framing, MIME sniffing, and browser capabilities', () => {
  const headers = new Map(getSecurityHeaders(false).map(({ key, value }) => [key, value]));
  assert.equal(headers.get('X-Frame-Options'), 'DENY');
  assert.equal(headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(headers.get('Strict-Transport-Security'), 'max-age=31536000; includeSubDomains');
  assert.equal(headers.get('Referrer-Policy'), 'no-referrer');
  assert.match(headers.get('Permissions-Policy') ?? '', /camera=\(\)/);
});

test('production CSP requires a nonce and excludes unsafe script directives', () => {
  const csp = buildContentSecurityPolicy('test-nonce', false);
  assert.match(csp, /script-src 'self' 'nonce-test-nonce' 'strict-dynamic'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/);
  assert.doesNotMatch(csp, /unsafe-eval/);
});

test('development CSP permits only the eval and websocket tooling exceptions', () => {
  const csp = buildContentSecurityPolicy('test-nonce', true);
  assert.match(csp, /unsafe-eval/);
  assert.match(csp, /ws: wss:/);
});
