import { STATUSES, URGENCY_LEVELS, labelFor } from '@/lib/constants';

export function UrgencyBadge({ urgency }) {
  return <span className={`badge badge-${urgency}`}>{labelFor(URGENCY_LEVELS, urgency)}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{labelFor(STATUSES, status)}</span>;
}
