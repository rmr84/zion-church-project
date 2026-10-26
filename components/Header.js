import Link from 'next/link';
import { DeskMenu } from '@/components/DeskMenu';
import { SiteMenu } from '@/components/SiteMenu';
import { listUnseenAssignmentNotifications } from '@/lib/desk-notifications';
import { listUnseenReviewNotifications } from '@/lib/reviews';
import { getRequester, getStaff, isStaffSignedIn } from '@/lib/session';
import { ADMIN_ROLE, getUser, getUserRole } from '@/lib/users';

export async function Header() {
  const staff = await isStaffSignedIn();
  const requester = await getRequester();
  const profile = requester ? await getUser(requester.uid).catch(() => null) : null;
  const staffIdentity = staff ? await getStaff() : null;
  const staffProfile = staffIdentity ? await getUser(staffIdentity.uid).catch(() => null) : null;
  const role = staffIdentity ? await getUserRole(staffIdentity.uid).catch(() => '') : '';
  const isAdmin = role === ADMIN_ROLE;
  const [assignmentNotifications, reviewNotifications] = await Promise.all([
    staffIdentity
      ? listUnseenAssignmentNotifications(staffIdentity.uid).catch(() => [])
      : Promise.resolve([]),
    staff && isAdmin
      ? listUnseenReviewNotifications().catch(() => [])
      : Promise.resolve([]),
  ]);
  const notificationCount = assignmentNotifications.length + reviewNotifications.length;
  const staffName = [staffProfile?.firstName, staffProfile?.lastName].filter(Boolean).join(' ');
  const member = {
    label: staffName || staffIdentity?.email || 'Care Team',
    photo: Boolean(staffProfile?.photoType),
    photoUpdatedAt: staffProfile?.photoUpdatedAt || '',
  };
  return (
    <header className="site-header">
      <div className="header-inner">
        {staff ? null : (
          <Link href="/" className="wordmark" aria-label="Zion Church">
            <img src="/zion-logo.png" alt="" width={293} height={80} />
          </Link>
        )}
        {staff ? <p className="desk-header-title">Care Team</p> : null}
        {staff ? (
          <DeskMenu
            member={member}
            notificationCount={notificationCount}
            assignmentNotifications={assignmentNotifications}
            reviewNotifications={reviewNotifications}
            isAdmin={isAdmin}
          />
        ) : (
          <SiteMenu>
            <nav className="primary-nav" aria-label="Primary">
              <Link href="/request">Request Care</Link>
              <Link href="/status">Check Status</Link>
              {requester ? <Link href="/account">My Requests</Link> : <Link href="/sign-in">Sign In</Link>}
              {requester ? (
                <Link href="/account/settings" className="account-nav">
                  {profile?.photoType ? (
                    <img src={`/api/profile-photo?v=${encodeURIComponent(profile.photoUpdatedAt)}`} alt="" width={28} height={28} />
                  ) : (
                    <span className="account-nav-mark" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="3.15" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M5.6 19.1c1.35-3.05 3.55-4.45 6.4-4.45s5.05 1.4 6.4 4.45" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </span>
                  )}
                  Account
                </Link>
              ) : null}
            </nav>
          </SiteMenu>
        )}
      </div>
    </header>
  );
}
