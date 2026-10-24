import { cookies } from 'next/headers';
import {
  COOKIE_NAME,
  REQUESTER_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  issueRequesterToken,
  issueSessionToken,
  readRequesterToken,
  verifySessionToken,
} from './session-token.js';

function sessionSecret() {
  const secret = process.env.STAFF_SESSION_SECRET || '';
  if (secret.length < 16) {
    throw new Error('STAFF_SESSION_SECRET must be at least 16 characters.');
  }
  return secret;
}

export async function isStaffSignedIn() {
  try {
    const jar = await cookies();
    return verifySessionToken(jar.get(COOKIE_NAME)?.value, sessionSecret());
  } catch {
    return false;
  }
}

export async function signInStaff() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, issueSessionToken(sessionSecret()), cookieOptions());
}

export async function signOutStaff() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function getRequester() {
  try {
    const jar = await cookies();
    return readRequesterToken(jar.get(REQUESTER_COOKIE_NAME)?.value, sessionSecret());
  } catch {
    return null;
  }
}

export async function signInRequester(identity) {
  const jar = await cookies();
  jar.set(
    REQUESTER_COOKIE_NAME,
    issueRequesterToken(sessionSecret(), identity.uid, identity.email),
    cookieOptions(),
  );
}

export async function signOutRequester() {
  const jar = await cookies();
  jar.delete(REQUESTER_COOKIE_NAME);
}
