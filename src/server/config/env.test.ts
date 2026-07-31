import assert from 'node:assert/strict';
import test from 'node:test';
import { env } from './env';

const withEnvironment = (
  values: Record<string, string | undefined>,
  assertion: () => void,
) => {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    assertion();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

test('rejects short JWT and admin secrets', () => {
  withEnvironment({ JWT_SECRET: 'short' }, () => {
    assert.throws(() => env.jwtSecret, /at least 32 bytes/);
  });
  withEnvironment({ ADMIN_API_KEY: 'short' }, () => {
    assert.throws(() => env.adminApiKey, /at least 32 bytes/);
  });
});

test('requires HTTPS for the production Vercel origin', () => {
  withEnvironment({
    VERCEL_ENV: 'production',
    APP_URL: 'http://jobtracker.example',
  }, () => {
    assert.throws(() => env.appUrl, /HTTPS/);
  });
});

test('allowlists configured origins without trusting request headers', () => {
  withEnvironment({
    VERCEL_ENV: undefined,
    APP_URL: 'https://jobtracker.example',
    TRUSTED_APP_ORIGINS: 'https://preview.example',
  }, () => {
    assert.deepEqual(
      [...env.trustedAppOrigins].sort(),
      ['https://jobtracker.example', 'https://preview.example'],
    );
  });
});
