'use client';

import { useEffect, useRef, useState } from 'react';
import { StatusBadge, UrgencyBadge } from '@/components/Badges';
import { CARE_TYPES, CONTACT_METHODS, STATUSES, URGENCY_LEVELS, labelFor } from '@/lib/constants';
import { formatDay, formatWhen } from '@/lib/format';

export function RequestTable({ requests }) {
  const dialogRef = useRef(null);
  const toastTimer = useRef(null);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);

  function dismissCopy() {
    window.clearTimeout(toastTimer.current);
    setCopied(false);
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setCopied(false), 5000);
  }

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  const showContact = selected
    && selected.contactMethod !== 'in_person'
    && selected.contactMethod !== 'none'
    && selected.contactDetail;

  return (
    <>
      <div className="request-table-wrap">
        <table className="request-table">
          <thead>
            <tr>
              <th scope="col" className="request-type">Type of Care</th>
              <th scope="col" className="request-urgency">Urgency</th>
              <th scope="col" className="request-code">Ref. Code</th>
              <th scope="col" className="request-status">Status</th>
              <th scope="col" className="request-date">Date</th>
              <th scope="col" className="request-more"><span className="sr-only">Details</span></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.referenceCode}>
                <td className="request-type">
                  <span className="cell-label">Type of Care</span>
                  {labelFor(CARE_TYPES, request.careType)}
                </td>
                <td className="request-urgency">
                  <span className="cell-label">Urgency</span>
                  {request.urgency ? <UrgencyBadge urgency={request.urgency} /> : null}
                </td>
                <td className="request-code">
                  <span className="cell-label">Reference Code</span>
                  <button
                    type="button"
                    className="ref-code"
                    aria-label={`Copy reference code ${request.referenceCode}`}
                    onClick={() => copyCode(request.referenceCode)}
                  >
                    {request.referenceCode}
                  </button>
                </td>
                <td className="request-status">
                  <span className="cell-label">Status</span>
                  <StatusBadge status={request.status} />
                </td>
                <td className="request-date">
                  <span className="cell-label">Date</span>
                  <time dateTime={request.createdAt}>{formatDay(request.createdAt)}</time>
                </td>
                <td className="request-more">
                  <span className="cell-label">Details</span>
                  <button
                    className="request-view"
                    type="button"
                    aria-label={`View ${labelFor(CARE_TYPES, request.careType)} request`}
                    onClick={() => setSelected(request)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2.2 12s3.6-6.2 9.8-6.2S21.8 12 21.8 12 18.2 18.2 12 18.2 2.2 12 2.2 12z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="12" cy="12" r="2.7" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dialog
        ref={dialogRef}
        className="sign-out-dialog request-dialog"
        aria-labelledby="request-code"
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}
      >
        {selected ? (
          <>
            <div className="sign-out-head">
              <button className="sign-out-close" type="button" aria-label="Close" onClick={() => setSelected(null)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="eyebrow">Reference code</p>
            <h2 id="request-code">{selected.referenceCode}</h2>
            <p>Updated {formatWhen(selected.updatedAt)}</p>
            <dl className="request-summary status-summary">
              <div>
                <dt>Name</dt>
                <dd>{selected.name || 'Name not given'}</dd>
              </div>
              <div>
                <dt>Type Of Care</dt>
                <dd>{labelFor(CARE_TYPES, selected.careType)}</dd>
              </div>
              <div>
                <dt>What Is Your Request?</dt>
                <dd>{selected.description}</dd>
              </div>
              <div>
                <dt>Preferred Contact Method</dt>
                <dd>{labelFor(CONTACT_METHODS, selected.contactMethod)}</dd>
              </div>
              {showContact ? (
                <div>
                  <dt>How Should We Reach You?</dt>
                  <dd>{selected.contactDetail}</dd>
                </div>
              ) : null}
              <div>
                <dt>Urgency</dt>
                <dd>{labelFor(URGENCY_LEVELS, selected.urgency)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{labelFor(STATUSES, selected.status)}</dd>
              </div>
              <div>
                <dt>Note for you</dt>
                <dd>{selected.memberNote.trim() || 'The care team has not added a note yet.'}</dd>
              </div>
            </dl>
          </>
        ) : null}
      </dialog>
      {copied ? (
        <div className="copy-toast" role="status">
          <span className="copy-toast-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 12.5l4.2 4.2L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="copy-toast-body">
            <p>Reference code copied</p>
            <button type="button" className="copy-toast-dismiss" onClick={dismissCopy}>Dismiss</button>
          </div>
          <button type="button" className="copy-toast-close" aria-label="Dismiss" onClick={dismissCopy}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : null}
    </>
  );
}
