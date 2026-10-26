import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge, UrgencyBadge } from '@/components/Badges';
import { StaffEditor } from '@/components/StaffEditor';
import { CARE_TYPES, CONTACT_METHODS, labelFor } from '@/lib/constants';
import { formatWhen } from '@/lib/format';
import { getStaffRequest } from '@/lib/requests';
import { listDeskMembers } from '@/lib/users';

export async function generateMetadata({ params }) {
  const { code } = await params;
  return { title: code };
}

function titleCase(value) {
  return String(value || '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function RequestDetailPage({ params }) {
  const { code } = await params;
  const [request, members] = await Promise.all([
    getStaffRequest(code),
    listDeskMembers(),
  ]);
  if (!request) notFound();

  const backHref = request.status === 'completed' ? '/staff/archive' : '/staff';
  const contact = [
    titleCase(labelFor(CONTACT_METHODS, request.contactMethod)),
    request.contactDetail || '',
  ].filter(Boolean).join(' · ');

  return (
    <section className="page-frame request-detail">
      <div className="page-heading">
        <Link href={backHref} className="desk-back" aria-label="Back To Care Requests">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Back</span>
        </Link>
        <div className="title-row">
          <h1>{labelFor(CARE_TYPES, request.careType)}</h1>
          <UrgencyBadge urgency={request.urgency} />
          <StatusBadge status={request.status} desk />
        </div>
        <p className="lede">{request.referenceCode}</p>
      </div>
      <div className="wrap wide detail-panel">
        <div className="detail-grid">
          <div>
            <dl className="meta">
              <dt>From</dt>
              <dd>{request.name ? titleCase(request.name) : 'Name Not Given'}</dd>
              <dt>Account</dt>
              <dd>{request.requesterEmail || 'No Account'}</dd>
              <dt>Contact</dt>
              <dd>{contact}</dd>
              <dt>Assignee</dt>
              <dd>
                {request.assignee
                  ? (request.assignee.includes('@') ? request.assignee : titleCase(request.assignee))
                  : 'Unassigned'}
              </dd>
              <dt>Submitted</dt>
              <dd>{formatWhen(request.createdAt)}</dd>
              <dt>Updated</dt>
              <dd>{formatWhen(request.updatedAt)}</dd>
              {request.completedAt ? (
                <>
                  <dt>Completed</dt>
                  <dd>{formatWhen(request.completedAt)}</dd>
                </>
              ) : null}
            </dl>
            <h2>What They Asked</h2>
            <p className="prose">{request.description}</p>
          </div>
          <StaffEditor
            key={`${request.updatedAt}-${request.status}`}
            referenceCode={request.referenceCode}
            status={request.status}
            assignee={request.assignee}
            memberNote={request.memberNote}
            internalNote={request.internalNote}
            members={members}
          />
        </div>
      </div>
    </section>
  );
}
