'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateRequestAssignee } from '@/app/actions/staff';
import { MemberPicker } from '@/components/MemberPicker';
import { useToast } from '@/components/Toast';

export function RequestActions({ request, members = [] }) {
  const router = useRouter();
  const showToast = useToast();
  const menuId = useId();
  const titleId = useId();
  const fieldId = useId();
  const rootRef = useRef(null);
  const dialogRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignee, setAssignee] = useState(request.assignee || '');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function closeOnOutside(event) {
      if (!rootRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (assignOpen && !dialog.open) dialog.showModal();
    if (!assignOpen && dialog.open) dialog.close();
  }, [assignOpen]);

  function openAssign() {
    setMenuOpen(false);
    setAssignee(request.assignee || '');
    setAssignOpen(true);
  }

  function openView() {
    setMenuOpen(false);
    router.push(`/staff/requests/${request.referenceCode}`);
  }

  const initialAssignee = request.assignee || '';
  const canSave = assignee !== initialAssignee;

  async function saveAssign(event) {
    event.preventDefault();
    if (!canSave) return;
    setPending(true);
    const result = await updateRequestAssignee(request.referenceCode, assignee);
    setPending(false);
    if (!result?.ok) {
      showToast?.(result?.formError || 'That assignment could not be saved.');
      return;
    }
    setAssignOpen(false);
    showToast?.('Request saved.');
    router.refresh();
  }

  return (
    <div className={`request-actions${menuOpen ? ' is-open' : ''}`} ref={rootRef}>
      <button
        className="request-actions-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        aria-label={`Actions for ${request.referenceCode}`}
        onClick={() => setMenuOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="1.6" fill="currentColor" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
          <circle cx="12" cy="19" r="1.6" fill="currentColor" />
        </svg>
      </button>
      {menuOpen ? (
        <div className="request-actions-menu" id={menuId} role="menu">
          <button type="button" role="menuitem" onClick={openAssign}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="9" cy="9" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M4.8 17.2c.8-2.2 2.3-3.3 4.2-3.3s3.4 1.1 4.2 3.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M15.5 11.5h5M18 9v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Assign
          </button>
          <button type="button" role="menuitem" onClick={openView}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.2 12s3.6-6.2 9.8-6.2S21.8 12 21.8 12 18.2 18.2 12 18.2 2.2 12 2.2 12z" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="2.7" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            View
          </button>
        </div>
      ) : null}

      <dialog
        ref={dialogRef}
        className="sign-out-dialog assign-dialog"
        aria-labelledby={titleId}
        onClose={() => setAssignOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setAssignOpen(false);
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
          <button className="sign-out-close" type="button" aria-label="Close" onClick={() => setAssignOpen(false)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <h2 id={titleId}>Assign Request</h2>
        <p>Choose a care team member for {request.referenceCode}.</p>
        <form className="assign-form" onSubmit={saveAssign}>
          <div className="field">
            <label htmlFor={fieldId}>Care Team Member</label>
            <MemberPicker
              id={fieldId}
              members={members}
              value={assignee}
              onChange={setAssignee}
              disabled={pending}
            />
          </div>
          <div className="modal-actions">
            <button className="button secondary" type="button" onClick={() => setAssignOpen(false)}>Cancel</button>
            <button className="button" type="submit" disabled={pending || !canSave}>
              {pending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
