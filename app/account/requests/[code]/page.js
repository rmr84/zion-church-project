import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { StatusBadge, UrgencyBadge } from '@/components/Badges';
import { StatusFeedback } from '@/components/StatusFeedback';
import { CARE_TYPES, CONTACT_METHODS, labelFor } from '@/lib/constants';
import { formatWhen } from '@/lib/format';
import { getRequesterOwnedRequest } from '@/lib/requests';
import { hasFeedbackForRequest } from '@/lib/reviews';
import { getRequester, isStaffSignedIn } from '@/lib/session';

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

export default async function RequesterRequestDetailPage({ params }) {
  if (await isStaffSignedIn()) redirect('/staff');
  const requester = await getRequester();
  if (!requester) redirect('/sign-in');

  const { code } = await params;
  const request = await getRequesterOwnedRequest(code, requester.uid);
  if (!request) notFound();

  const feedbackOnFile = request.status === 'completed'
    && (await hasFeedbackForRequest(request.referenceCode));
  const canSubmitFeedback = request.status === 'completed' && !feedbackOnFile;
  const contact = [
    titleCase(labelFor(CONTACT_METHODS, request.contactMethod)),
    request.contactMethod !== 'in_person'
      && request.contactMethod !== 'none'
      && request.contactDetail
      ? request.contactDetail
      : '',
  ].filter(Boolean).join(' · ');

  return (
    <section className="page-frame request-detail">
      <div className="page-heading">
        <Link href="/account" className="desk-back" aria-label="Back To My Requests">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Back</span>
        </Link>
        <div className="title-row">
          <h1>{labelFor(CARE_TYPES, request.careType)}</h1>
          <UrgencyBadge urgency={request.urgency} />
          <StatusBadge status={request.status} />
        </div>
        <p className="lede">{request.referenceCode}</p>
      </div>
      <div className="wrap wide detail-panel">
        <div className="detail-grid requester-detail-grid">
          <div>
            <dl className="meta">
              <dt>From</dt>
              <dd>{request.name ? titleCase(request.name) : 'Name Not Given'}</dd>
              <dt>Account</dt>
              <dd>{request.requesterEmail || requester.email || 'No Account'}</dd>
              <dt>Contact</dt>
              <dd>{contact || 'No Contact Needed'}</dd>
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
            <h2>What You Asked</h2>
            <p className="prose">{request.description}</p>
          </div>
          <div className="requester-detail-notes">
            <h2>Notes For You</h2>
            <p className="prose">
              {String(request.memberNote || '').trim() || 'The care team has not added a note yet.'}
            </p>
            {canSubmitFeedback ? (
              <StatusFeedback
                referenceCode={request.referenceCode}
                defaultName={request.name || ''}
              />
            ) : null}
            {feedbackOnFile ? (
              <p className="hint feedback-sent">Thank you. The care team will review your feedback.</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
