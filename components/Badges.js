import { URGENCY_LEVELS, labelFor, statusLabel } from '@/lib/constants';

export function UrgencyBadge({ urgency }) {
  return (
    <span className={`badge badge-soft badge-${urgency}`}>
      <span className="badge-dot" aria-hidden="true" />
      {labelFor(URGENCY_LEVELS, urgency)}
    </span>
  );
}

export function StatusBadge({ status, desk = false }) {
  return <span className={`badge badge-${status}`}>{statusLabel(status, { desk })}</span>;
}
