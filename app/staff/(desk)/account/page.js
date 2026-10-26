import { redirect } from 'next/navigation';
import { logout } from '@/app/actions/staff';
import { AccountSettings } from '@/components/AccountSettings';
import { getStaff } from '@/lib/session';
import { ADMIN_ROLE, CARE_TEAM_ROLE, getUser, getUserRole } from '@/lib/users';

export const metadata = { title: 'Account' };

export default async function StaffAccountPage() {
  const staff = await getStaff();
  const role = staff ? await getUserRole(staff.uid) : '';
  if (!staff || (role !== ADMIN_ROLE && role !== CARE_TEAM_ROLE)) {
    redirect('/staff/account/renew');
  }

  const stored = await getUser(staff.uid).catch(() => null);
  const profile = {
    email: staff.email,
    firstName: stored?.firstName || '',
    lastName: stored?.lastName || '',
    phone: stored?.phone || '',
    emailNotifications: stored ? stored.emailNotifications : true,
    inAppNotifications: stored ? stored.inAppNotifications : true,
    photoType: stored?.photoType || '',
    photoUpdatedAt: stored?.photoUpdatedAt || '',
  };

  return (
    <section className="page-frame">
      <div className="page-heading">
        <p className="eyebrow">{role === ADMIN_ROLE ? 'Admin' : 'Care Team'}</p>
        <h1>Account</h1>
      </div>
      <div className="wrap settings">
        <p className="lede">View and update the information on this account.</p>
        <AccountSettings profile={profile} signOutAction={logout} accountScope="desk" />
      </div>
    </section>
  );
}
