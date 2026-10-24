import Link from 'next/link';
import { CARE_TYPES, labelFor } from '@/lib/constants';
import { formatDay } from '@/lib/format';
import { StatusBadge, UrgencyBadge } from './Badges';

export function RequestList({ requests }) {
  return (
    <ol className="request-list">
      {requests.map((request) => (
        <li key={request.referenceCode}>
          <Link className="request-row" href={`/staff/requests/${request.referenceCode}`}>
            <UrgencyBadge urgency={request.urgency} />
            <span className="row-main">
              <span className="row-title">{labelFor(CARE_TYPES, request.careType)}</span>
              <span className="row-sub">
                {request.name || 'Name not given'}
                {' · '}
                {request.referenceCode}
              </span>
            </span>
            <StatusBadge status={request.status} />
            <time dateTime={request.createdAt}>{formatDay(request.createdAt)}</time>
          </Link>
        </li>
      ))}
    </ol>
  );
}
