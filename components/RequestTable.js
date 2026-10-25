'use client';

import { useEffect, useRef, useState } from 'react';
import { StatusBadge, UrgencyBadge } from '@/components/Badges';
import { CARE_TYPES, CONTACT_METHODS, STATUSES, URGENCY_LEVELS, labelFor } from '@/lib/constants';
import { formatDay, formatWhen } from '@/lib/format';

export function RequestTable({ requests }) {
  const dialogRef = useRef(null);
  const [selected, setSelected] = useState(null);

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
              <th scope="col" className="request-description">Description</th>
              <th scope="col">Urgency</th>
              <th scope="col">Reference Code</th>
              <th scope="col">Status</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.referenceCode}>
                <td className="request-type">
                  <span className="cell-label">Type of Care</span>
                  <button className="request-open" type="button" onClick={() => setSelected(request)}>
                    {labelFor(CARE_TYPES, request.careType)}
                  </button>
                </td>
                <td className="request-description">
              
                  <span>{request.description}</span>
                </td>
                <td>
                  <span className="cell-label">Urgency</span>
                  {request.urgency ? <UrgencyBadge urgency={request.urgency} /> : null}
                </td>
                <td>
                  <span className="cell-label">Reference Code</span>
                  {request.referenceCode}
                </td>
                <td>
                  <span className="cell-label">Status</span>
                  <StatusBadge status={request.status} />
                </td>
                <td>
                  <span className="cell-label">Date</span>
                  <time dateTime={request.createdAt}>{formatDay(request.createdAt)}</time>
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
    </>
  );
}
