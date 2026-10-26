import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  issueRequesterToken,
  issueSessionToken,
  issueStaffToken,
  readRequesterToken,
  readStaffToken,
  secretsMatch,
  verifySessionToken,
} from '../lib/session-token.js';

const secret = 'demo-only-change-this-secret';

test('password comparison ignores length differences', () => {
  assert.equal(secretsMatch('correct-secret', 'correct-secret'), true);
  assert.equal(secretsMatch('a', 'correct-secret'), false);
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
  assert.equal(readRequesterToken(token, secret, now), null);
});

test('requester sessions stay separate from the care team session', () => {
  const now = Date.parse('2026-10-23T12:00:00.000Z');
  const token = issueRequesterToken(secret, 'firebaseUid1234', 'Member@Zion.Example', now, 1000);
  assert.deepEqual(readRequesterToken(token, secret, now + 500), {
    uid: 'firebaseUid1234',
    email: 'member@zion.example',
  });
  assert.equal(readRequesterToken(token, secret, now + 1000), null);
  assert.equal(verifySessionToken(token, secret, now), false);
  assert.equal(readRequesterToken(token, 'another-secret-value', now), null);
});

test('a care team session carries the member and stays separate from a requester session', () => {
  const now = Date.parse('2026-10-23T12:00:00.000Z');
  const token = issueStaffToken(secret, 'firebaseUid1234', 'Desk@Zion.Example', now, 1000);
  assert.equal(verifySessionToken(token, secret, now + 500), true);
  assert.deepEqual(readStaffToken(token, secret, now + 500), {
    uid: 'firebaseUid1234',
    email: 'desk@zion.example',
  });
  assert.equal(readStaffToken(token, secret, now + 1000), null);
  assert.equal(readRequesterToken(token, secret, now), null);
});
