'use client';

import { useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateRequest } from '@/app/actions/staff';
import { MemberPicker } from '@/components/MemberPicker';
import { StatusPicker } from '@/components/StatusPicker';
import { useToast } from '@/components/Toast';
import { findMember, memberValue } from '@/lib/members';

function assigneeValue(members, assignee) {
  const matched = findMember(members, assignee);
  return matched ? memberValue(matched) : (assignee || '');
}

export function StaffEditor({
  referenceCode,
  status,
  assignee,
  memberNote,
  internalNote,
  members = [],
}) {
  const router = useRouter();
  const showToast = useToast();
  const statusId = useId();
  const summaryRef = useRef(null);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState({});
  const [values, setValues] = useState({
    status,
    assignee: assigneeValue(members, assignee),
    memberNote: memberNote || '',
    internalNote: internalNote || '',
  });
  const errorEntries = Object.entries(errors);

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setErrors({});
    const data = new FormData(event.currentTarget);
    data.set('status', values.status);
    data.set('assignee', values.assignee);
    data.set('memberNote', values.memberNote);
    data.set('internalNote', values.internalNote);

    let result;
    try {
      result = await updateRequest({ errors: {}, saved: false }, data);
    } catch (error) {
      if (typeof error?.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) throw error;
      setPending(false);
      showToast?.('That request could not be saved.');
      return;
    }

    setPending(false);
    if (!result?.saved) {
      const nextErrors = result?.errors || { form: 'That request could not be saved.' };
      setErrors(nextErrors);
      const message = nextErrors.form
        || Object.values(nextErrors).find(Boolean)
        || 'That request could not be saved.';
      showToast?.(message);
      queueMicrotask(() => summaryRef.current?.focus());
      return;
    }

    if (values.status === 'completed' && status !== 'completed') {
      showToast?.('Request Saved.', {
        href: '/staff/archive',
        label: 'View this request in Archive tab',
      });
    } else if (status === 'completed' && values.status !== 'completed') {
      showToast?.('Request Saved.', {
        href: '/staff',
        label: 'View this request in Active tab',
      });
    } else {
      showToast?.('Request Saved.');
    }
    router.refresh();
  }

  return (
    <form className="stack staff-editor" aria-busy={pending} onSubmit={onSubmit}>
      <input type="hidden" name="referenceCode" value={referenceCode} />
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
        <label id={statusId}>Status</label>
        <p className="hint" id="status-hint">Completed Requests Move To The Archive. They Are Not Deleted.</p>
        <input type="hidden" name="status" value={values.status} />
        <StatusPicker
          status={values.status}
          disabled={pending}
          onChange={(value) => setField('status', value)}
          aria-labelledby={statusId}
          aria-describedby="status-hint"
          aria-invalid={Boolean(errors.status)}
        />
      </div>

      <div className="field">
        <label htmlFor="assignee">Assignee</label>
        <p className="hint" id="assignee-hint">Shown To The Care Team Only.</p>
        <MemberPicker
          id="assignee"
          name="assignee"
          members={members}
          value={values.assignee}
          onChange={(value) => setField('assignee', value)}
          disabled={pending}
          aria-describedby="assignee-hint"
          aria-invalid={Boolean(errors.assignee)}
        />
      </div>

      <div className="field">
        <label htmlFor="memberNote">Note For The Member</label>
        <p className="hint" id="memberNote-hint">
          Anyone With The Reference Code Can Read This. Leave Medical Details Out Of It.
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
        <label htmlFor="internalNote">Care Team Note</label>
        <p className="hint" id="internalNote-hint">
          Never Shown On The Status Page, And Left Out Of The Notification Log.
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

      <button className="button staff-editor-save" type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  );
}
