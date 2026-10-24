import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RequesterSignIn } from '@/components/RequesterSignIn';
import { getRequester } from '@/lib/session';

export const metadata = { title: 'Care requester sign in' };

export default async function RequesterSignInPage() {
  if (await getRequester()) redirect('/account');

  return (
    <section className="wrap narrow">
      <p className="eyebrow">Care requester</p>
      <h1>Sign in</h1>
      <p className="lede">
        An account keeps the requests you send while you are signed in.
      
      </p>
      <RequesterSignIn />
      <p className="or-divider">or</p>
      <p className="sign-in-alt">
        <Link href="/request">Request Care Without Account</Link>
      </p>
      <p className="sign-in-alt">
        <Link href="/staff/login">Care Team Sign In</Link>
      </p>
    </section>
  );
}
