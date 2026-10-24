'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { establishRequesterSession, registerRequester } from '@/app/actions/requester';
import { PasswordInput } from '@/components/PasswordInput';
import { firebaseApp } from '@/lib/firebase';
import { sendAccountVerification } from '@/lib/send-verification';

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
    const auth = getAuth(firebaseApp);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await credential.user.reload();
      const idToken = await credential.user.getIdToken(true);
      if (!credential.user.emailVerified) {
        await registerRequester(idToken);
        try {
          await sendAccountVerification(credential.user);
          setError('Confirm your email before signing in. We sent another link to that address.');
        } catch (caught) {
          setError(caught?.code === 'auth/too-many-requests'
            ? 'Confirm your email before signing in. Use the link already in your inbox.'
            : 'Confirm your email before signing in.');
        }
        await signOut(auth);
        return;
      }
      const result = await establishRequesterSession(idToken);
      if (result?.reason === 'unverified') {
        await signOut(auth);
        setError('Confirm your email before signing in. Use the link already in your inbox.');
      } else if (result?.reason === 'storage') {
        setError('That account could not be saved. Try again.');
      } else if (result && result.ok === false) {
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
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          minLength={6}
          required
          invalid={Boolean(error)}
          aria-describedby={error ? 'sign-in-error' : undefined}
        />
        <p className="forgot-password">
          <Link href="/forgot-password">Forgot Password?</Link>
        </p>
        {error ? <p className="banner error sign-in-error" id="sign-in-error" role="alert">{error}</p> : null}
      </div>
      <div className="sign-in-actions">
        <button className="button block" type="submit" disabled={pending}>Sign in</button>
        <Link className="button secondary block" href="/create-account">Create Account</Link>
      </div>
    </form>
  );
}
