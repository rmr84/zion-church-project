'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { inviteUser } from '@/app/actions/users';
import { RolePicker } from '@/components/RolePicker';
import { useToast } from '@/components/Toast';

const CARE_TEAM_ROLE = 'careTeam';

export function InviteUser({ canInvite = false }) {
  const router = useRouter();
  const showToast = useToast();
  const titleId = useId();
  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const roleId = useId();
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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

  function resetForm() {
    setFirstName('');
    setLastName('');
    setEmail('');
    setRole(CARE_TEAM_ROLE);
    setError('');
  }

  function close() {
    if (pending) return;
    setOpen(false);
    resetForm();
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    const result = await inviteUser({ email, role, firstName, lastName });
    setPending(false);
    if (!result?.ok) {
      setError(result?.formError || 'That invitation could not be sent.');
      return;
    }
    setOpen(false);
    resetForm();
    showToast?.('Invitation sent.');
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
        className="sign-out-dialog assign-dialog invite-dialog"
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
          <div className="invite-name-fields">
            <div className="field">
              <label htmlFor={firstNameId}>First Name <span className="hint-inline">(optional)</span></label>
              <input
                id={firstNameId}
                type="text"
                autoComplete="given-name"
                maxLength={80}
                value={firstName}
                disabled={pending}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor={lastNameId}>Last Name <span className="hint-inline">(optional)</span></label>
              <input
                id={lastNameId}
                type="text"
                autoComplete="family-name"
                maxLength={80}
                value={lastName}
                disabled={pending}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
          </div>
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
            <label id={roleId}>Role</label>
            <RolePicker
              role={role}
              disabled={pending}
              aria-labelledby={roleId}
              onChange={setRole}
            />
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
