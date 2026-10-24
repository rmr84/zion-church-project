'use client';

import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { establishRequesterSession } from '@/app/actions/requester';
import { firebaseApp } from '@/lib/firebase';
import { passwordProblem } from '@/lib/password-rules';

function messageFor(code) {
  if (code === 'auth/email-already-in-use') return 'An account with that email already exists. Sign in instead.';
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (code === 'auth/weak-password') return 'Password needs at least 8 characters, one capital letter, and one number or special character.';
  if (code === 'auth/operation-not-allowed') return 'Email sign-in is not turned on for this Firebase project yet.';
  return 'Something went wrong. Try again.';
}

function problemsFor(fields) {
  const errors = {};
  if (!fields.email) errors.email = 'Enter an email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errors.email = 'Enter a valid email address.';
  if (!fields.password) errors.password = 'Enter a password.';
  else {
    const problem = passwordProblem(fields.password);
    if (problem) errors.password = problem;
  }
  if (!fields.confirm) errors.confirm = 'Confirm your password.';
  else if (!errors.password && fields.password !== fields.confirm) errors.confirm = 'Those passwords do not match.';
  return errors;
}

export function CreateAccount() {
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const key = ['email', 'password', 'confirm'].find((name) => errors[name]);
    if (key) document.getElementById(key)?.focus();
  }, [errors, attempt]);

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fields = {
      email: String(data.get('email') || '').trim(),
      password: String(data.get('password') || ''),
      confirm: String(data.get('confirm') || ''),
    };
    const nextErrors = problemsFor(fields);
    setFormError('');
    setErrors(nextErrors);
    setAttempt((current) => current + 1);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      const auth = getAuth(firebaseApp);
      const credential = await createUserWithEmailAndPassword(auth, fields.email, fields.password);
      const idToken = await credential.user.getIdToken();
      const result = await establishRequesterSession(idToken);
      if (result && result.ok === false) {
        setFormError('That account could not be confirmed. Try again.');
      }
    } catch (caught) {
      const message = messageFor(caught?.code);
      if (caught?.code === 'auth/invalid-email' || caught?.code === 'auth/email-already-in-use') {
        setErrors({ email: message });
      } else if (caught?.code === 'auth/weak-password') {
        setErrors({ password: message });
      } else {
        setFormError(message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="stack" aria-busy={pending} onSubmit={submit} noValidate>
      {formError ? <p className="banner error" role="alert">{formError}</p> : null}
      <div className="field">
        <label htmlFor="email">Email<span className="required" aria-hidden="true">*</span></label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email ? <p className="field-error" id="email-error">{errors.email}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="password">Password<span className="required" aria-hidden="true">*</span></label>
        <p className="hint" id="password-hint">At least 8 characters, one capital letter, and one number or special character.</p>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'password-hint password-error' : 'password-hint'}
        />
        {errors.password ? <p className="field-error" id="password-error">{errors.password}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="confirm">Confirm password<span className="required" aria-hidden="true">*</span></label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(errors.confirm)}
          aria-describedby={errors.confirm ? 'confirm-error' : undefined}
        />
        {errors.confirm ? <p className="field-error" id="confirm-error">{errors.confirm}</p> : null}
      </div>
      <div className="sign-in-actions">
        <button className="button block" type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create Account'}
        </button>
      </div>
    </form>
  );
}
