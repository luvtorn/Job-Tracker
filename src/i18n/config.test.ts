import assert from 'node:assert/strict';
import test from 'node:test';
import { messages } from './messages';
import { locales, normalizeLocale, resolveLocale } from './config';

test('normalizes supported browser locales', () => {
  assert.equal(normalizeLocale('pl-PL'), 'pl');
  assert.equal(normalizeLocale('ru_RU'), 'ru');
  assert.equal(normalizeLocale('en-US'), 'en');
  assert.equal(normalizeLocale('de-DE'), null);
});

test('prefers a saved locale and falls back through Accept-Language', () => {
  assert.equal(resolveLocale('ru', 'pl-PL,pl;q=0.9'), 'ru');
  assert.equal(resolveLocale(null, 'de-DE,de;q=0.9,pl-PL;q=0.8'), 'pl');
  assert.equal(resolveLocale(null, 'de-DE'), 'en');
});

const collectKeys = (value: object, prefix = ''): string[] => Object.entries(value).flatMap(([key, child]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return typeof child === 'object' && child !== null ? collectKeys(child, path) : [path];
});

test('all locale dictionaries contain the same keys', () => {
  const expected = collectKeys(messages.en).sort();
  for (const locale of locales) assert.deepEqual(collectKeys(messages[locale]).sort(), expected);
});
