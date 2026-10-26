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

export async function createFirebaseAuthUser(email, password = '') {
  const nextPassword = String(password || '').trim() || randomAuthPassword();
  const result = await identityRequest('accounts:signUp', {
    email,
    password: nextPassword,
    returnSecureToken: true,
  });
  if (result.ok) {
    return {
      ok: true,
      uid: result.data.localId,
      idToken: result.data.idToken || '',
      refreshToken: result.data.refreshToken || '',
      password: nextPassword,
      created: true,
    };
  }
  if (result.code === 'EMAIL_EXISTS') {
    return {
      ok: true,
      uid: '',
      idToken: '',
      refreshToken: '',
      password: '',
      created: false,
    };
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

async function idTokenFromRefresh(refreshToken) {
  const key = apiKey();
  const token = String(refreshToken || '').trim();
  if (!key || !token) return '';

  let response;
  try {
    response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: token,
        }),
      },
    );
  } catch {
    return '';
  }
  if (!response.ok) return '';
  const payload = await response.json().catch(() => ({}));
  return String(payload.id_token || '');
}

async function idTokenFromPassword(email, password) {
  const result = await identityRequest('accounts:signInWithPassword', {
    email,
    password,
    returnSecureToken: true,
  });
  if (!result.ok) return '';
  return String(result.data.idToken || '');
}

export async function deleteFirebaseAuthUser({
  email = '',
  password = '',
  refreshToken = '',
  passwords = [],
} = {}) {
  let idToken = await idTokenFromRefresh(refreshToken);
  const candidates = [
    String(password || '').trim(),
    ...passwords.map((value) => String(value || '').trim()),
    'Test12345!',
  ].filter(Boolean);
  const tried = new Set();
  for (const candidate of candidates) {
    if (idToken || tried.has(candidate)) continue;
    tried.add(candidate);
    idToken = await idTokenFromPassword(email, candidate);
  }
  if (!idToken) {
    return {
      ok: false,
      formError: 'That Firebase account could not be removed. The invite password is no longer valid (often after a reset). Remove it in Firebase Auth, then delete again.',
    };
  }

  const result = await identityRequest('accounts:delete', { idToken });
  if (!result.ok) {
    if (result.code === 'USER_NOT_FOUND') return { ok: true };
    console.error('Firebase account delete failed.', result.code || result.error || '');
    return {
      ok: false,
      formError: result.code
        ? `That Firebase account could not be removed (${result.code}).`
        : 'That Firebase account could not be removed.',
    };
  }
  return { ok: true };
}
