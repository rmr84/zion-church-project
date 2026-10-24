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
        You can send this with or without an account.
      </p>
      {requester ? (
        <p className="hint">Signed in as {requester.email}. This request will be saved to that account.</p>
      ) : (
        <p className="hint">
          <Link href="/sign-in">Sign in</Link>
          {' '}
          if you want this request kept on an account. Sending it without one still works.
        </p>
      )}
      <RequestForm />
    </section>
  );
}
