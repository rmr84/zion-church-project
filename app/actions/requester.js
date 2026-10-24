'use server';

import { redirect } from 'next/navigation';
import { lookupFirebaseUser } from '@/lib/firebase-identity';
import { signInRequester, signOutRequester } from '@/lib/session';
import { saveUser } from '@/lib/users';

async function storeRequester(identity) {
  try {
    await saveUser(identity);
    return { ok: true };
  } catch (error) {
    console.error('Could not save the care requester.', error?.code || '');
    return { ok: false, reason: 'storage' };
  }
}

export async function registerRequester(idToken) {
  const identity = await lookupFirebaseUser(idToken);
  if (!identity) return { ok: false };
  return storeRequester(identity);
}

export async function establishRequesterSession(idToken) {
  const identity = await lookupFirebaseUser(idToken);
  if (!identity) return { ok: false };
  if (!identity.emailVerified) return { ok: false, reason: 'unverified' };
  const stored = await storeRequester(identity);
  if (!stored.ok) return stored;
  await signInRequester(identity);
  redirect('/account');
}

export async function signOutOfRequester() {
  await signOutRequester();
  redirect('/');
}
