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

export const REQUESTER_COOKIE_NAME = 'zion_requester';

export function requesterUid(uid) {
  const id = String(uid || '');
  return /^[A-Za-z0-9]{8,128}$/.test(id) ? id : null;
}

export function requesterIdentity(uid, email) {
  const id = requesterUid(uid);
  const address = String(email || '').trim().toLowerCase();
  if (!id) return null;
  if (address.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return null;
  return { uid: id, email: address };
}

export function issueRequesterToken(secret, uid, email, now = Date.now(), ttlMs = SESSION_TTL_SECONDS * 1000) {
  const identity = requesterIdentity(uid, email);
  if (!identity) throw new Error('A requester session needs a Firebase user id and email.');
  const payload = `requester.${now + ttlMs}.${identity.uid}.${Buffer.from(identity.email, 'utf8').toString('base64url')}`;
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function readRequesterToken(token, secret, now = Date.now()) {
  if (!secret || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 5) return null;

  const [role, expiresAt, uid, emailEncoded, signature] = parts;
  if (role !== 'requester' || !/^\d+$/.test(expiresAt)) return null;
  if (Number(expiresAt) <= now) return null;

  const payload = `${role}.${expiresAt}.${uid}.${emailEncoded}`;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const actualBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (actualBuffer.length === 0 || actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  let email = '';
  try {
    email = Buffer.from(emailEncoded, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  return requesterIdentity(uid, email);
}
