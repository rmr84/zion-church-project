import { URGENCY_LEVELS, labelFor, statusLabel } from '@/lib/constants';

const ROLE_BADGE = {
  Admin: 'admin',
  'Care Team': 'care_team',
  Requester: 'requester',
};

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

export function RoleBadge({ role }) {
  const tone = ROLE_BADGE[role] || 'care_team';
  return <span className={`badge badge-${tone}`}>{role || 'Care Team'}</span>;
}
