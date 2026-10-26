import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ForgotPassword } from '@/components/ForgotPassword';
import { getRequester, isStaffSignedIn } from '@/lib/session';

export const metadata = { title: 'Forgot Password' };

export default async function ForgotPasswordPage({ searchParams }) {
  if (await isStaffSignedIn()) redirect('/staff');
  if (await getRequester()) redirect('/account');
  const params = await searchParams;
  const defaultEmail = String(params?.email || '').trim();

  return (
    <section className="page-frame">
      <div className="page-heading centered-web">
        <p className="eyebrow">Care requester</p>
        <h1>Forgot Password</h1>
      </div>
      <div className="wrap narrow">
        <p className="lede">
          Enter the email on the account. A link in that inbox sets a new password.
        </p>
        <ForgotPassword defaultEmail={defaultEmail} />
        <p className="sign-in-alt">
          <Link href="/sign-in">Back to Sign In</Link>
        </p>
      </div>
    </section>
  );
}
