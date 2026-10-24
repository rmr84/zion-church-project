'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { updateRequest } from '@/app/actions/staff';
import { STATUSES } from '@/lib/constants';

export function StaffEditor({ referenceCode, status, assignee, memberNote, internalNote }) {
  const [state, action, pending] = useActionState(updateRequest, { errors: {}, saved: false });
  const [values, setValues] = useState({
    status,
    assignee: assignee || '',
    memberNote: memberNote || '',
    internalNote: internalNote || '',
  });
  const summaryRef = useRef(null);
  const errors = state.errors || {};
  const errorEntries = Object.entries(errors);

  useEffect(() => {
    if (errorEntries.length > 0) summaryRef.current?.focus();
  }, [state, errorEntries.length]);

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  return (
    <form action={action} className="stack" aria-busy={pending}>
      <input type="hidden" name="referenceCode" value={referenceCode} />
      {state.saved ? <p className="banner ok" role="status">Saved.</p> : null}
      {errorEntries.length > 0 ? (
        <div className="banner error" role="alert" tabIndex={-1} ref={summaryRef}>
          <ul>
            {errorEntries.map(([key, message]) => (
              <li key={key}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="status">Status</label>
        <p className="hint" id="status-hint">Completed requests move to the archive. They are not deleted.</p>
        <select
          id="status"
          name="status"
          aria-describedby="status-hint"
          aria-invalid={Boolean(errors.status)}
          value={values.status}
          onChange={(event) => setField('status', event.target.value)}
        >
          {STATUSES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="assignee">Assigned to</label>
        <p className="hint" id="assignee-hint">Shown to the care team only.</p>
        <input
          id="assignee"
          name="assignee"
          maxLength={120}
          autoComplete="off"
          aria-describedby="assignee-hint"
          aria-invalid={Boolean(errors.assignee)}
          value={values.assignee}
          onChange={(event) => setField('assignee', event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="memberNote">Note for the member</label>
        <p className="hint" id="memberNote-hint">
          Anyone with the reference code can read this. Leave medical details out of it.
        </p>
        <textarea
          id="memberNote"
          name="memberNote"
          rows={4}
          maxLength={2000}
          aria-describedby="memberNote-hint"
          aria-invalid={Boolean(errors.memberNote)}
          value={values.memberNote}
          onChange={(event) => setField('memberNote', event.target.value)}
        />
      </div>

      <div className="private-panel">
        <label htmlFor="internalNote">Care team note</label>
        <p className="hint" id="internalNote-hint">
          Never shown on the status page, and left out of the notification log.
        </p>
        <textarea
          id="internalNote"
          name="internalNote"
          rows={4}
          maxLength={2000}
          autoComplete="off"
          aria-describedby="internalNote-hint"
          aria-invalid={Boolean(errors.internalNote)}
          value={values.internalNote}
          onChange={(event) => setField('internalNote', event.target.value)}
        />
      </div>

      <button className="button" type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
