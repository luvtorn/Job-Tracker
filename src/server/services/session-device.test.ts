import assert from 'node:assert/strict';
import test from 'node:test';
import { describeSessionDevice } from './session-device';

test('describes Edge on Windows without exposing the user agent', () => {
  assert.deepEqual(
    describeSessionDevice('Mozilla/5.0 (Windows NT 10.0) Chrome/126.0 Safari/537.36 Edg/126.0'),
    { browser: 'EDGE', platform: 'WINDOWS', deviceType: 'DESKTOP' },
  );
});

test('describes mobile Chrome on Android', () => {
  assert.deepEqual(
    describeSessionDevice('Mozilla/5.0 (Linux; Android 14) Chrome/126.0 Mobile Safari/537.36'),
    { browser: 'CHROME', platform: 'ANDROID', deviceType: 'MOBILE' },
  );
});

test('uses safe fallback values when metadata is missing', () => {
  assert.deepEqual(describeSessionDevice(null), {
    browser: 'UNKNOWN',
    platform: 'UNKNOWN',
    deviceType: 'DESKTOP',
  });
});
