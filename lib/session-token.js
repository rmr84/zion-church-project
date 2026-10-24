import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE_NAME = 'zion_staff';
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

export function secretsMatch(input, expected) {
  const left = createHash('sha256').update(String(input), 'utf8').digest();
  const right = createHash('sha256').update(String(expected), 'utf8').digest();
  return timingSafeEqual(left, right);
}

export function issueSessionToken(secret, now = Date.now(), ttlMs = SESSION_TTL_SECONDS * 1000) {
  const payload = `staff.${now + ttlMs}`;
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token, secret, now = Date.now()) {
  if (!secret || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [role, expiresAt, signature] = parts;
  if (role !== 'staff' || !/^\d+$/.test(expiresAt)) return false;

  const payload = `${role}.${expiresAt}`;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const actualBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (actualBuffer.length === 0 || actualBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return false;
  return Number(expiresAt) > now;
}
