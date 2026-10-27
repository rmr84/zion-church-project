'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateRequestStatus } from '@/app/actions/staff';
import { StatusBadge, UrgencyBadge } from '@/components/Badges';
import { MemberAvatar } from '@/components/MemberAvatar';
import { RequestActions } from '@/components/RequestActions';
import { RequestPager } from '@/components/RequestPager';
import { StatusPicker } from '@/components/StatusPicker';
import { useToast } from '@/components/Toast';
import { CARE_TYPES, labelFor } from '@/lib/constants';
import { formatDay } from '@/lib/format';
import { findMember, memberLabel } from '@/lib/members';

const WEB_PAGE_SIZE = 5;
const PHONE_PAGE_SIZE = 3;

export function RequestTable({
  requests,
  desk = false,
  members = [],
  allowAssign = true,
  allowReopen = true,
}) {
  const router = useRouter();
  const showToast = useToast();
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
                      allowReopen={allowReopen}
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
                      onClick={() => router.push(`/account/requests/${request.referenceCode}`)}
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
        <RequestPager
          page={currentPage}
          pageCount={pageCount}
          onPageChange={setPage}
          label="Request pages"
        />
      </div>
    </>
  );
}
