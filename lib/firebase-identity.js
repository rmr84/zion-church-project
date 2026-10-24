import { requesterIdentity } from './session-token.js';

export async function lookupFirebaseUser(idToken) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
  const token = String(idToken || '').trim();
  if (!apiKey || token.length < 20 || token.length > 8192) return null;

  let response;
  try {
    response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      },
    );
  } catch {
    return null;
  }

  if (!response.ok) return null;
  const body = await response.json().catch(() => null);
  const user = body?.users?.[0];
  return requesterIdentity(user?.localId, user?.email);
}
