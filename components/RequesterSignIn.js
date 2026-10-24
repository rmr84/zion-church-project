'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { establishRequesterSession } from '@/app/actions/requester';
import { firebaseApp } from '@/lib/firebase';

function messageFor(code) {
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-login-credentials') {
    return 'That email and password did not match.';
  }
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (code === 'auth/operation-not-allowed') return 'Email sign-in is not turned on for this Firebase project yet.';
  return 'Something went wrong. Try again.';
}

function fieldsFrom(form) {
  const data = new FormData(form);
  return {
    email: String(data.get('email') || '').trim(),
    password: String(data.get('password') || ''),
  };
}

export function RequesterSignIn() {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(form) {
    const { email, password } = fieldsFrom(form);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Use at least 6 characters.');
      return;
    }

    setError('');
    setPending(true);
    try {
      const auth = getAuth(firebaseApp);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      const result = await establishRequesterSession(idToken);
      if (result && result.ok === false) {
        setError('That sign-in could not be confirmed. Try again.');
      }
    } catch (caught) {
      setError(messageFor(caught?.code));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="stack"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        void submit(event.currentTarget);
      }}
    >
      {error ? <p className="banner error" role="alert">{error}</p> : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={6}
          required
        />
      </div>
      <div className="sign-in-actions">
        <button className="button block" type="submit" disabled={pending}>Sign in</button>
        <Link className="button secondary block" href="/create-account">Create Account</Link>
      </div>
    </form>
  );
}
