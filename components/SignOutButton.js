'use client';

import { useEffect, useRef, useState } from 'react';
import { signOutOfRequester } from '@/app/actions/requester';

export function SignOutButton() {
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button className="text-button" type="button" onClick={() => setOpen(true)}>Sign out</button>
      <dialog
        ref={dialogRef}
        className="sign-out-dialog"
        aria-labelledby="sign-out-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className="sign-out-head">
          <span className="sign-out-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="3.15" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M5.6 19.1c1.35-3.05 3.55-4.45 6.4-4.45s5.05 1.4 6.4 4.45" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <button className="sign-out-close" type="button" aria-label="Close" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <h2 id="sign-out-title">Sign out</h2>
        <p>Are you sure you want to sign out?</p>
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={() => setOpen(false)}>Cancel</button>
          <form action={signOutOfRequester}>
            <button className="button" type="submit">Sign out</button>
          </form>
        </div>
      </dialog>
    </>
  );
}
