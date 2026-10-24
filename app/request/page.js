import Link from 'next/link';
import { RequestForm } from '@/components/RequestForm';
import { getRequester } from '@/lib/session';

export const metadata = { title: 'Request care' };

export default async function RequestPage() {
  const requester = await getRequester();

  return (
    <section className="wrap narrow">
      <p className="eyebrow">New request</p>
      <h1>Request care</h1>
     
      <p className="hint">If you or someone else is in danger, call 911. This desk is not an emergency line.</p>
      <RequestForm />
      {requester ? (
        <p className="hint account-note">Signed in as {requester.email}. This request will be saved to that account.</p>
      ) : (
        <p className="hint account-note">
          <Link href="/sign-in">Sign in</Link>
          {' '}
          to your care request account if you want this request kept on your account.
        </p>
      )}
    </section>
  );
}
