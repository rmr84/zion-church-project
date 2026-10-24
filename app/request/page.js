import Link from 'next/link';
import { RequestForm } from '@/components/RequestForm';
import { getRequester, isStaffSignedIn } from '@/lib/session';
import { getUser } from '@/lib/users';

export const metadata = { title: 'Request care' };

export default async function RequestPage() {
  const requester = await getRequester();
  const staff = await isStaffSignedIn();
  const stored = requester ? await getUser(requester.uid).catch(() => null) : null;
  const defaults = requester ? {
    name: [stored?.firstName, stored?.lastName].filter(Boolean).join(' '),
    email: requester.email || '',
    phone: stored?.phone || '',
  } : null;

  return (
    <section className="wrap narrow">
      <p className="eyebrow">New request</p>
      <h1>Request Care</h1>
     
      <p className="hint">If you or someone else is in danger, please call 911. This desk is not an emergency line.</p>
      <RequestForm defaults={defaults} />
      {!requester && !staff ? (
         <p className="hint account-note">
         <Link href="/sign-in">Sign In</Link>
         {' '}
         to your care request account if you want this request kept on your account.
       </p>
       
      ) : (
       null
      )}
    </section>
  );
}
