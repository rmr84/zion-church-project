'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { establishRequesterSession } from '@/app/actions/requester';
import { firebaseApp } from '@/lib/firebase';

function messageFor(code) {
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-login-credentials') {
    return 'That email and password did not match.';
  }
  if (code === 'auth/email-already-in-use') return 'An account with that email already exists. Sign in instead.';
  if (code === 'auth/weak-password') return 'Use at least 6 characters.';
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (code === 'auth/operation-not-allowed') return 'Email sign-in is not turned on for this Firebase project yet.';
  return 'Something went wrong. Try again.';
}

export function RequesterSignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(mode) {
    setError('');
    setPending(true);
    try {
      const auth = getAuth(firebaseApp);
      const credential = mode === 'create'
        ? await createUserWithEmailAndPassword(auth, email.trim(), password)
        : await signInWithEmailAndPassword(auth, email.trim(), password);
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
        void submit('sign-in');
      }}
    >
      {error ? <p className="banner error" role="alert">{error}</p> : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
        />
      </div>
      <div className="actions">
        <button className="button" type="submit" disabled={pending}>Sign in</button>
        <button className="button secondary" type="button" disabled={pending} onClick={() => void submit('create')}>
          Create account
        </button>
      </div>
    </form>
  );
}
