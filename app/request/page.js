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
      <p className="lede">
        Share only what the team needs. Your name is optional.
 
      </p>
      {requester ? (
        <p className="hint">Signed in as {requester.email}. This request will be saved to that account.</p>
      ) : (
        <p className="hint">
          <Link href="/sign-in">Sign in</Link>
          {' '}
          to your care request account if you want this request kept on your account. 
        </p>
      )}
      <RequestForm />
    </section>
  );
}
