'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { inviteUser } from '@/app/actions/users';
import { useToast } from '@/components/Toast';

const CARE_TEAM_ROLE = 'careTeam';
const ADMIN_ROLE = 'Admin';

const ROLES = [
  { value: CARE_TEAM_ROLE, label: 'Care Team' },
  { value: ADMIN_ROLE, label: 'Admin' },
];

export function InviteUser({ canInvite = false }) {
  const router = useRouter();
  const showToast = useToast();
  const titleId = useId();
  const emailId = useId();
  const roleId = useId();
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(CARE_TEAM_ROLE);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!canInvite) return null;

  function close() {
    if (pending) return;
    setOpen(false);
    setError('');
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    const result = await inviteUser(email, role);
    setPending(false);
    if (!result?.ok) {
      setError(result?.formError || 'That invitation could not be sent.');
      return;
    }
    setEmail('');
    setRole(CARE_TEAM_ROLE);
    setOpen(false);
    showToast?.(result.alreadyMember ? 'Invite email sent again.' : 'Invitation sent.');
    router.refresh();
  }

  return (
    <div className="invite-user">
      <button className="button invite-user-button" type="button" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        Invite User
      </button>

      <dialog
        ref={dialogRef}
        className="sign-out-dialog assign-dialog"
        aria-labelledby={titleId}
        onClose={close}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="sign-out-head">
          <span className="sign-out-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="9" cy="9" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M4.8 17.2c.8-2.2 2.3-3.3 4.2-3.3s3.4 1.1 4.2 3.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M15.5 11.5h5M18 9v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <button className="sign-out-close" type="button" aria-label="Close" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <h2 id={titleId}>Invite User</h2>
        <p>Send an email so they can set a password and join the care desk.</p>
        <form className="assign-form" onSubmit={onSubmit}>
          {error ? <p className="banner error" role="alert">{error}</p> : null}
          <div className="field">
            <label htmlFor={emailId}>Email</label>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              required
              maxLength={200}
              value={email}
              disabled={pending}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={roleId}>Role</label>
            <select
              id={roleId}
              value={role}
              disabled={pending}
              onChange={(event) => setRole(event.target.value)}
            >
              {ROLES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button className="button secondary" type="button" disabled={pending} onClick={close}>
              Cancel
            </button>
            <button className="button" type="submit" disabled={pending || !email.trim()}>
              {pending ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
