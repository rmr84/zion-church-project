import assert from 'node:assert/strict';
import { test } from 'node:test';
import { issueSessionToken, secretsMatch, verifySessionToken } from '../lib/session-token.js';

const secret = 'demo-only-change-this-secret';

test('password comparison ignores length differences', () => {
  assert.equal(secretsMatch('zion-care-team', 'zion-care-team'), true);
  assert.equal(secretsMatch('a', 'zion-care-team'), false);
});

test('session tokens reject tampering and expiry', () => {
  const now = Date.parse('2026-10-23T12:00:00.000Z');
  const token = issueSessionToken(secret, now, 1000);
  assert.equal(verifySessionToken(token, secret, now + 500), true);
  assert.equal(verifySessionToken(token, secret, now + 1000), false);

  const [role, exp, signature] = token.split('.');
  const flipped = `${signature.slice(0, -1)}${signature.endsWith('a') ? 'b' : 'a'}`;
  assert.equal(verifySessionToken(`${role}.${exp}.${flipped}`, secret, now), false);
  assert.equal(verifySessionToken(token, 'another-secret-value', now), false);
});
