import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

const collectRoutes = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name);
  if (entry.isDirectory()) return collectRoutes(path);
  return entry.name === 'route.ts' ? [path] : [];
});

const routes = collectRoutes(resolve('src/app/api'));

test('route handlers never access Prisma directly', () => {
  for (const route of routes) {
    const source = readFileSync(route, 'utf8');
    assert.doesNotMatch(source, /@\/lib\/prisma|\bprisma\./, route);
  }
});

test('route handlers validate JSON, query strings, and dynamic resource IDs', () => {
  for (const route of routes) {
    const source = readFileSync(route, 'utf8');
    if (source.includes('request.json()')) assert.match(source, /Schema\.parse\(|schema\.parse\(/, route);
    if (source.includes('searchParams')) assert.match(source, /Schema\.parse\(|schema\.parse\(/, route);
    if (source.includes('await params') || source.includes('context.params')) {
      assert.match(source, /IdSchema\.parse\(|resourceIdSchema\.parse\(/, route);
    }
  }
});

test('non-streaming routes use centralized unexpected-error handling', () => {
  for (const route of routes.filter((route) => !route.endsWith(join('notifications', 'stream', 'route.ts')))) {
    assert.match(readFileSync(route, 'utf8'), /handleApiError/, route);
  }
});
