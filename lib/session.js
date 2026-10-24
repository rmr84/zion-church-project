import { cookies } from 'next/headers';
import {
  COOKIE_NAME,
  SESSION_TTL_SECONDS,
  issueSessionToken,
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
  jar.set(COOKIE_NAME, issueSessionToken(sessionSecret()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function signOutStaff() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
