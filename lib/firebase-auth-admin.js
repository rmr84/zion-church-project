import { randomBytes } from 'node:crypto';

function apiKey() {
  return String(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '').trim();
}

async function identityRequest(path, body) {
  const key = apiKey();
  if (!key) return { ok: false, error: 'Firebase is not configured.' };

  let response;
  try {
    response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/${path}?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
  } catch {
    return { ok: false, error: 'Firebase could not be reached.' };
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = String(payload?.error?.message || '');
    return { ok: false, error: message || 'Firebase request failed.', code: message };
  }
  return { ok: true, data: payload };
}

export function randomAuthPassword() {
  return `A9!${randomBytes(24).toString('base64url')}`;
}

export async function createFirebaseAuthUser(email) {
  const password = randomAuthPassword();
  const result = await identityRequest('accounts:signUp', {
    email,
    password,
    returnSecureToken: true,
  });
  if (result.ok) {
    return {
      ok: true,
      uid: result.data.localId,
      idToken: result.data.idToken,
      created: true,
    };
  }
  if (result.code === 'EMAIL_EXISTS') {
    return { ok: true, uid: '', idToken: '', created: false };
  }
  return { ok: false, formError: 'That account could not be created in Firebase.' };
}

export async function sendFirebasePasswordReset(email, continueUrl = '') {
  const body = {
    requestType: 'PASSWORD_RESET',
    email,
  };
  if (continueUrl) body.continueUrl = continueUrl;

  let result = await identityRequest('accounts:sendOobCode', body);
  if (!result.ok && body.continueUrl) {
    delete body.continueUrl;
    result = await identityRequest('accounts:sendOobCode', body);
  }
  if (!result.ok) {
    if (result.code === 'EMAIL_NOT_FOUND') {
      return { ok: false, formError: 'No Firebase account uses that email yet.' };
    }
    if (result.code === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
      return { ok: false, formError: 'Too many email attempts. Try again in a little while.' };
    }
    return { ok: false, formError: 'The invitation email could not be sent.' };
  }
  return { ok: true };
}
