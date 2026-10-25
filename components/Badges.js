import { URGENCY_LEVELS, labelFor, statusLabel } from '@/lib/constants';

export function UrgencyBadge({ urgency }) {
  return <span className={`badge badge-${urgency}`}>{labelFor(URGENCY_LEVELS, urgency)}</span>;
}

export function StatusBadge({ status, desk = false }) {
  return <span className={`badge badge-${status}`}>{statusLabel(status, { desk })}</span>;
}
