import { redirect } from 'next/navigation';
import { logout } from '@/app/actions/staff';
import { AccountSettings } from '@/components/AccountSettings';
import { getStaff, isStaffSignedIn, signOutStaff } from '@/lib/session';
import { ADMIN_ROLE, CARE_TEAM_ROLE, getUser, getUserRole } from '@/lib/users';

export const metadata = { title: 'Account' };

export default async function StaffAccountPage() {
  const staff = await getStaff();
  if (!staff) {
    if (await isStaffSignedIn()) await signOutStaff();
    redirect('/staff/login');
  }

  const role = await getUserRole(staff.uid);
  if (role !== ADMIN_ROLE && role !== CARE_TEAM_ROLE) {
    await signOutStaff();
    redirect('/staff/login');
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
        <p className="eyebrow">{role === ADMIN_ROLE ? 'Admin' : 'Care team'}</p>
        <h1>Account</h1>
      </div>
      <div className="wrap settings">
        <p className="lede">View and update the information on this account.</p>
        <AccountSettings profile={profile} signOutAction={logout} />
      </div>
    </section>
  );
}
