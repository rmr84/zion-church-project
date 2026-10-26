import { NotificationsFeed } from '@/components/NotificationsFeed';
import { listUnseenAssignmentNotifications } from '@/lib/desk-notifications';
import { listUnseenReviewNotifications } from '@/lib/reviews';
import { getStaff } from '@/lib/session';
import { ADMIN_ROLE, getUserRole } from '@/lib/users';

export const metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const staff = await getStaff();
  const role = staff ? await getUserRole(staff.uid) : '';
  const isAdmin = role === ADMIN_ROLE;
  const [assignmentNotifications, reviewNotifications] = await Promise.all([
    staff ? listUnseenAssignmentNotifications(staff.uid) : Promise.resolve([]),
    isAdmin ? listUnseenReviewNotifications() : Promise.resolve([]),
  ]);

  return (
    <section className="page-frame">
      <div className="page-heading">
        <h1>Notifications</h1>
      </div>
      <div className="wrap wide">
        <div className="desk-notifications-page">
          <NotificationsFeed
            assignments={assignmentNotifications}
            reviews={reviewNotifications}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </section>
  );
}
