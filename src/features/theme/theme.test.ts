import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getNextThemePreference,
  parseThemePreference,
  resolveTheme,
} from '@/features/theme/theme';

test('theme preference accepts only supported local values', () => {
  assert.equal(parseThemePreference('dark'), 'dark');
  assert.equal(parseThemePreference('light'), 'light');
  assert.equal(parseThemePreference('system'), 'system');
  assert.equal(parseThemePreference('javascript:alert(1)'), 'system');
  assert.equal(parseThemePreference(null), 'system');
});

test('system theme follows the operating system while explicit choices win', () => {
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
});

test('compact theme control cycles through all preferences', () => {
  assert.equal(getNextThemePreference('system'), 'light');
  assert.equal(getNextThemePreference('light'), 'dark');
  assert.equal(getNextThemePreference('dark'), 'system');
});
