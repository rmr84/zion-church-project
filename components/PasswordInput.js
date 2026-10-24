'use client';

import { useState } from 'react';

function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 4.5l18 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M9.4 8.1A9 9 0 0 1 12 7.4c5.6 0 9 4.6 9 4.6a16 16 0 0 1-3.1 3.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.2 9.3A16 16 0 0 0 3 12s3.4 4.6 9 4.6c.8 0 1.6-.1 2.3-.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.1 10.3a2.4 2.4 0 0 0 3.3 3.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12S6 7 12 7s9.5 5 9.5 5-3.5 5-9.5 5S2.5 12 2.5 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function PasswordInput({ invalid, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} aria-invalid={invalid || undefined} />
      <button className="password-toggle" type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible((current) => !current)}>
        <EyeIcon hidden={visible} />
      </button>
    </div>
  );
}
