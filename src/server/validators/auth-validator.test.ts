import assert from 'node:assert/strict';
import test from 'node:test';
import {
  completeOAuthRegistrationSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/server/validators/auth-validator';

test('accepts an OAuth registration with a supported role', () => {
  const result = completeOAuthRegistrationSchema.parse({
    firstName: '  Anna  ',
    lastName: '  Kowalska  ',
    role: 'RECRUITER',
  });

  assert.deepEqual(result, {
    firstName: 'Anna',
    lastName: 'Kowalska',
    role: 'RECRUITER',
  });
});

test('applies password strength requirements to password resets', () => {
  assert.equal(resetPasswordSchema.safeParse({
    token: 'a'.repeat(32),
    password: 'weak-password',
  }).success, false);

  assert.equal(resetPasswordSchema.safeParse({
    token: 'a'.repeat(32),
    password: 'StrongPassword1',
  }).success, true);
});

test('rejects passwords that exceed the bcrypt byte boundary', () => {
  const password = `${'😀'.repeat(18)}A1a`;
  assert.equal(registerSchema.safeParse({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password,
    role: 'SEEKER',
  }).success, false);
});
