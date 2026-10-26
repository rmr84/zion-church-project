import fs from 'node:fs';
import { ReviewNotifications } from '@/components/ReviewNotifications';
import { defaultLogPath } from '@/lib/notify';
import { listUnseenReviewNotifications } from '@/lib/reviews';
import { getStaff } from '@/lib/session';
import { ADMIN_ROLE, getUserRole } from '@/lib/users';

export const metadata = { title: 'Notifications' };

function readEntries() {
  try {
    return fs
      .readFileSync(defaultLogPath(), 'utf8')
      .split('\n---\n')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .reverse();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export default async function NotificationsPage() {
  const [entries, reviewNotifications, staff] = await Promise.all([
    Promise.resolve(readEntries()),
    listUnseenReviewNotifications(),
    getStaff(),
  ]);
  const role = staff ? await getUserRole(staff.uid) : '';

  return (
    <section className="page-frame">
      <div className="page-heading">
        <h1>Notifications</h1>
      </div>
      <div className="wrap wide">
        <section className="reviews-desk-section">
          <h2>New Reviews</h2>
          <ReviewNotifications
            notifications={reviewNotifications}
            canModerate={role === ADMIN_ROLE}
          />
        </section>

        <section className="reviews-desk-section">
          <h2>Email Log</h2>
          <p className="lede">
            When a request is received, its status changes, or a desk invite is sent, the email we
            would send is written here and printed in the server console. Invite password links are
            still delivered by Firebase. Care team notes are left out.
          </p>
          {entries.length === 0 ? (
            <p className="empty">Nothing has been logged yet. Save a status change to write the first one.</p>
          ) : (
            entries.map((entry, index) => (
              <pre key={`${index}-${entry.slice(0, 40)}`} className="log">{entry}</pre>
            ))
          )}
        </section>
      </div>
    </section>
  );
}
