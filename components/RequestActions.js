'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateRequestAssignee } from '@/app/actions/staff';
import { MemberPicker } from '@/components/MemberPicker';
import { useToast } from '@/components/Toast';

export function RequestActions({ request, members = [], allowAssign = true }) {
  const router = useRouter();
  const showToast = useToast();
  const menuId = useId();
  const titleId = useId();
  const fieldId = useId();
  const noteId = useId();
  const rootRef = useRef(null);
  const dialogRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [assignee, setAssignee] = useState(request.assignee || '');
  const [careNote, setCareNote] = useState('');
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

  function closeAssign() {
    setAssignOpen(false);
    setStep(1);
    setCareNote('');
  }

  function openAssign() {
    setMenuOpen(false);
    setAssignee(request.assignee || '');
    setCareNote('');
    setStep(1);
    setAssignOpen(true);
  }

  function openView() {
    setMenuOpen(false);
    router.push(`/staff/requests/${request.referenceCode}`);
  }

  const initialAssignee = request.assignee || '';
  const canSave = assignee !== initialAssignee;

  async function finishAssign(options = {}) {
    if (!canSave) return;
    setPending(true);
    const result = await updateRequestAssignee(request.referenceCode, assignee, options);
    setPending(false);
    if (!result?.ok) {
      showToast?.(result?.formError || 'That assignment could not be saved.');
      return;
    }
    closeAssign();
    showToast?.('Request saved.');
    router.refresh();
  }

  function continueAssign(event) {
    event.preventDefault();
    if (!canSave) return;
    if (!assignee) {
      finishAssign();
      return;
    }
    setStep(2);
  }

  function skipNote() {
    finishAssign();
  }

  function submitNote(event) {
    event.preventDefault();
    const note = careNote.trim();
    finishAssign(note ? { internalNote: note } : {});
  }

  function ActionOption({ onClick, children, menu = false }) {
    return (
      <button type="button" role={menu ? 'menuitem' : undefined} onClick={onClick}>
        {children}
      </button>
    );
  }

  const assignIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="9" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.8 17.2c.8-2.2 2.3-3.3 4.2-3.3s3.4 1.1 4.2 3.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.5 11.5h5M18 9v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  const viewIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.2 12s3.6-6.2 9.8-6.2S21.8 12 21.8 12 18.2 18.2 12 18.2 2.2 12 2.2 12z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.7" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );

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
          {allowAssign ? (
            <ActionOption menu onClick={openAssign}>{assignIcon}Assign</ActionOption>
          ) : null}
          <ActionOption menu onClick={openView}>{viewIcon}View</ActionOption>
        </div>
      ) : null}
      <div className="request-actions-buttons" role="group" aria-label={`Actions for ${request.referenceCode}`}>
        {allowAssign ? (
          <ActionOption onClick={openAssign}>{assignIcon}Assign</ActionOption>
        ) : null}
        <ActionOption onClick={openView}>{viewIcon}View</ActionOption>
      </div>

      <dialog
        ref={dialogRef}
        className="sign-out-dialog assign-dialog"
        aria-labelledby={titleId}
        onClose={closeAssign}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeAssign();
        }}
      >
        <div className="sign-out-head">
          <span className="sign-out-icon" aria-hidden="true">
            {step === 1 ? (
              <svg viewBox="0 0 24 24">
                <circle cx="9" cy="9" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4.8 17.2c.8-2.2 2.3-3.3 4.2-3.3s3.4 1.1 4.2 3.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M15.5 11.5h5M18 9v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M7 7.5h10M7 12h10M7 16.5h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <rect x="4.5" y="4" width="15" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </span>
          <button className="sign-out-close" type="button" aria-label="Close" onClick={closeAssign}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {step === 1 ? (
          <>
            <h2 id={titleId}>Assign Request</h2>
            <p>Choose a care team member for {request.referenceCode}.</p>
            <form className="assign-form" onSubmit={continueAssign}>
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
                <button className="button secondary" type="button" onClick={closeAssign}>Cancel</button>
                <button className="button" type="submit" disabled={pending || !canSave}>
                  {pending ? 'Saving…' : assignee ? 'Continue' : 'Save'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 id={titleId}>Care Team Note</h2>
            <p>Add a private note for the care team, or skip this step.</p>
            <form className="assign-form" onSubmit={submitNote}>
              <div className="field">
                <label htmlFor={noteId}>Note</label>
                <p className="hint" id={`${noteId}-hint`}>
                  Never shown on the status page, and left out of the email log.
                </p>
                <textarea
                  id={noteId}
                  rows={4}
                  maxLength={2000}
                  aria-describedby={`${noteId}-hint`}
                  value={careNote}
                  disabled={pending}
                  onChange={(event) => setCareNote(event.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button className="button secondary" type="button" disabled={pending} onClick={skipNote}>
                  {pending ? 'Saving…' : 'Skip'}
                </button>
                <button className="button" type="submit" disabled={pending}>
                  {pending ? 'Saving…' : 'Submit'}
                </button>
              </div>
            </form>
          </>
        )}
      </dialog>
    </div>
  );
}
