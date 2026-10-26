'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useToast } from '@/components/Toast';

export function StatusFeedback({ referenceCode, defaultName = '' }) {
  const showToast = useToast();
  const titleId = useId();
  const quoteId = useId();
  const nameId = useId();
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [quote, setQuote] = useState('');
  const [name, setName] = useState(defaultName || '');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function close() {
    setOpen(false);
    setError('');
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    let result;
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceCode,
          quote,
          name,
        }),
      });
      result = await response.json();
    } catch {
      setPending(false);
      setError('That feedback could not be sent. Try again.');
      return;
    }
    setPending(false);
    if (!result?.ok) {
      setError(result?.formError || 'That feedback could not be sent.');
      return;
    }
    setSubmitted(true);
    close();
    showToast?.('Feedback submitted.');
  }

  if (submitted) {
    return <p className="hint feedback-sent">Thank you. The care team will review your feedback.</p>;
  }

  return (
    <div className="status-feedback">
      <button className="button" type="button" onClick={() => setOpen(true)}>
        Submit Feedback
      </button>

      <dialog
        ref={dialogRef}
        className="sign-out-dialog feedback-dialog"
        aria-labelledby={titleId}
        onClose={close}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="sign-out-head">
          <span className="sign-out-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M7 7.5h10M7 12h10M7 16.5h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <rect x="4.5" y="4" width="15" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </span>
          <button className="sign-out-close" type="button" aria-label="Close" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <h2 id={titleId}>Submit Feedback</h2>
        <p>Share how this care request went. The care team reviews feedback before it appears on the site.</p>
        <form className="assign-form" onSubmit={onSubmit}>
          {error ? <p className="banner error" role="alert">{error}</p> : null}
          <div className="field">
            <label htmlFor={quoteId}>Your Feedback</label>
            <textarea
              id={quoteId}
              rows={5}
              maxLength={1000}
              required
              value={quote}
              disabled={pending}
              onChange={(event) => setQuote(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={nameId}>Name <span className="hint-inline">(optional)</span></label>
            <input
              id={nameId}
              maxLength={80}
              autoComplete="name"
              value={name}
              disabled={pending}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button className="button secondary" type="button" onClick={close}>Cancel</button>
            <button className="button" type="submit" disabled={pending || quote.trim().length < 8}>
              {pending ? 'Sending…' : 'Submit'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
