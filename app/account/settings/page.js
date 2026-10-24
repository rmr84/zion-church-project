import { redirect } from 'next/navigation';
import { AccountSettings } from '@/components/AccountSettings';
import { getRequester } from '@/lib/session';
import { getUser } from '@/lib/users';

export const metadata = { title: 'Account' };

export default async function AccountSettingsPage() {
  const requester = await getRequester();
  if (!requester) redirect('/sign-in');

  const stored = await getUser(requester.uid).catch(() => null);
  const profile = {
    email: requester.email,
    firstName: stored?.firstName || '',
    lastName: stored?.lastName || '',
    emailNotifications: stored ? stored.emailNotifications : true,
    inAppNotifications: stored ? stored.inAppNotifications : true,
    photoType: stored?.photoType || '',
    photoUpdatedAt: stored?.photoUpdatedAt || '',
  };

  return (
    <section className="wrap settings">
      <p className="eyebrow">Care requester</p>
      <h1>Account</h1>
      <p className="lede">View and update the information on this account.</p>
      <AccountSettings profile={profile} />
    </section>
  );
}
