'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateRequestStatus } from '@/app/actions/staff';
import { StatusBadge, UrgencyBadge } from '@/components/Badges';
import { MemberAvatar } from '@/components/MemberAvatar';
import { RequestActions } from '@/components/RequestActions';
import { StatusPicker } from '@/components/StatusPicker';
import { useToast } from '@/components/Toast';
import { CARE_TYPES, CONTACT_METHODS, STATUSES, URGENCY_LEVELS, labelFor } from '@/lib/constants';
import { formatDay, formatWhen } from '@/lib/format';
import { findMember, memberLabel } from '@/lib/members';

const WEB_PAGE_SIZE = 5;
const PHONE_PAGE_SIZE = 3;

export function RequestTable({ requests, desk = false, members = [], allowAssign = true }) {
  const dialogRef = useRef(null);
  const router = useRouter();
  const showToast = useToast();
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(WEB_PAGE_SIZE);
  const [statuses, setStatuses] = useState(() => (
    Object.fromEntries(requests.map((request) => [request.referenceCode, request.status]))
  ));
  const [pendingCode, setPendingCode] = useState('');

  useEffect(() => {
    setStatuses(Object.fromEntries(requests.map((request) => [request.referenceCode, request.status])));
  }, [requests]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 759px)');
    function apply() {
      const nextSize = media.matches ? PHONE_PAGE_SIZE : WEB_PAGE_SIZE;
      setPageSize(nextSize);
      setPage((value) => Math.min(value, Math.max(0, Math.ceil(requests.length / nextSize) - 1)));
    }
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [requests.length]);

  const pageCount = Math.max(1, Math.ceil(requests.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = requests.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  async function changeStatus(request, nextStatus) {
    if (!desk || nextStatus === (statuses[request.referenceCode] || request.status)) return;
    const previous = statuses[request.referenceCode] || request.status;
    setStatuses((current) => ({ ...current, [request.referenceCode]: nextStatus }));
    setPendingCode(request.referenceCode);
    const result = await updateRequestStatus(request.referenceCode, nextStatus);
    setPendingCode('');
    if (!result?.ok) {
      setStatuses((current) => ({ ...current, [request.referenceCode]: previous }));
      showToast?.(result?.formError || 'That status could not be saved.');
      return;
    }
    if (nextStatus === 'completed') {
      showToast?.('Status updated.', {
        href: '/staff/archive',
        label: 'View this request in Archive tab',
      });
    } else if (previous === 'completed') {
      showToast?.('Status updated.', {
        href: '/staff',
        label: 'View this request in Active tab',
      });
    } else {
      showToast?.('Status updated.');
    }
    router.refresh();
  }

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
              <th scope="col" className="request-status">Status</th>
              {desk ? <th scope="col" className="request-assignee">Assignee</th> : null}
              <th scope="col" className="request-date">Date</th>
              <th scope="col" className="request-more">{desk ? 'Actions' : <span className="sr-only">Details</span>}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((request) => {
              const matched = desk ? findMember(members, request.assignee) : null;
              const assignee = matched || (request.assignee ? {
                label: request.assignee,
                initials: String(request.assignee).trim().charAt(0).toUpperCase() || '?',
              } : null);
              const assigneeName = matched
                ? memberLabel(matched)
                : (request.assignee || 'Unassigned');
              return (
              <tr key={request.referenceCode}>
                <td className="request-type">
                  <span className="cell-label">Type of Care</span>
                  {labelFor(CARE_TYPES, request.careType)}
                </td>
                <td className="request-urgency">
                  <span className="cell-label">Urgency</span>
                  {request.urgency ? <UrgencyBadge urgency={request.urgency} /> : null}
                </td>
                <td className="request-status">
                  <span className="cell-label">Status</span>
                  {desk ? (
                    <StatusPicker
                      status={statuses[request.referenceCode] || request.status}
                      disabled={pendingCode === request.referenceCode}
                      onChange={(nextStatus) => changeStatus(request, nextStatus)}
                    />
                  ) : (
                    <StatusBadge status={request.status} />
                  )}
                </td>
                {desk ? (
                  <td className="request-assignee">
                    <span className="cell-label">Assignee</span>
                    <span className="request-assignee-mark" title={assigneeName}>
                      <MemberAvatar member={assignee} />
                      <span className="sr-only">{assigneeName}</span>
                    </span>
                  </td>
                ) : null}
                <td className="request-date">
                  <span className="cell-label">Date</span>
                  <time dateTime={request.createdAt}>{formatDay(request.createdAt)}</time>
                </td>
                <td className="request-more">
                  <span className="cell-label">{desk ? 'Actions' : 'Details'}</span>
                  {desk ? (
                    <RequestActions
                      request={request}
                      members={members}
                      allowAssign={allowAssign}
                    />
                  ) : (
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
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        {pageCount > 1 ? (
          <nav className="request-pager" aria-label="Request pages">
            <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0}>
              Previous
            </button>
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-current={index === currentPage ? 'page' : undefined}
                onClick={() => setPage(index)}
              >
                {index + 1}
              </button>
            ))}
            <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount - 1}>
              Next
            </button>
          </nav>
        ) : null}
      </div>
      {desk ? null : (
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
                  <dt>Note For You</dt>
                  <dd>{selected.memberNote.trim() || 'The care team has not added a note yet.'}</dd>
                </div>
              </dl>
            </>
          ) : null}
        </dialog>
      )}
    </>
  );
}
