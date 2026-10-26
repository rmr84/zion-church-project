'use client';

import { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';

function messageFor(code) {
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (code === 'auth/user-not-found') return 'No account uses that email.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Try again in a little while.';
  return 'Something went wrong. Try again.';
}

export function ForgotPassword({ defaultEmail = '' }) {
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email') || '').trim();
    if (!email) {
      setSent(false);
      setError('Enter an email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSent(false);
      setError('Enter a valid email address.');
      return;
    }

    setError('');
    setSent(false);
    setPending(true);
    const auth = getAuth(firebaseApp);
    const settings = { url: `${window.location.origin}/sign-in` };
    try {
      try {
        await sendPasswordResetEmail(auth, email, settings);
      } catch (caught) {
        if (caught?.code === 'auth/unauthorized-continue-uri' || caught?.code === 'auth/invalid-continue-uri') {
          await sendPasswordResetEmail(auth, email);
        } else {
          throw caught;
        }
      }
      setSent(true);
    } catch (caught) {
      setError(messageFor(caught?.code));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="stack" noValidate aria-busy={pending} onSubmit={submit}>
      <div className="field">
        <label htmlFor="reset-email">Email</label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={defaultEmail}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'reset-error' : sent ? 'reset-sent' : undefined}
        />
      </div>
      {error ? <p className="banner error" id="reset-error" role="alert">{error}</p> : null}
      {sent ? <p className="banner ok" id="reset-sent" role="status">A reset link was sent to that email.</p> : null}
      <button className="button block" type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Send Reset Email'}
      </button>
    </form>
  );
}
