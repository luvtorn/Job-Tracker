import assert from 'node:assert/strict';
import test from 'node:test';
import { isNeonConnectionString } from './database-adapter';

test('uses the Neon adapter only for Neon database hosts', () => {
  assert.equal(
    isNeonConnectionString(
      'postgresql://user:password@ep-example-pooler.eu-central-1.aws.neon.tech/neondb',
    ),
    true,
  );
  assert.equal(
    isNeonConnectionString('postgresql://postgres:postgres@127.0.0.1:5432/jobtracker_test'),
    false,
  );
  assert.equal(
    isNeonConnectionString('postgresql://postgres:postgres@localhost:5432/jobtracker_test'),
    false,
  );
});
