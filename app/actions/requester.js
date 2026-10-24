'use server';

import { redirect } from 'next/navigation';
import { lookupFirebaseUser } from '@/lib/firebase-identity';
import { signInRequester, signOutRequester } from '@/lib/session';

export async function establishRequesterSession(idToken) {
  const identity = await lookupFirebaseUser(idToken);
  if (!identity) return { ok: false };
  await signInRequester(identity);
  redirect('/account');
}

export async function signOutOfRequester() {
  await signOutRequester();
  redirect('/');
}
