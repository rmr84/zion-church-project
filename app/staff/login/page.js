import Link from 'next/link';
import { redirect } from 'next/navigation';
import { StaffSignIn } from '@/components/StaffSignIn';
import { isStaffSignedIn } from '@/lib/session';

export const metadata = { title: 'Care Team Sign In' };

export default async function StaffLoginPage({ searchParams }) {
  const params = await searchParams;
  if (await isStaffSignedIn()) redirect('/staff');
  const again = params?.again === 'account';

  return (
    <section className="page-frame">
      <div className="page-heading centered">
        <p className="eyebrow">Care Team</p>
        <h1>Sign In</h1>
      </div>
      <div className="wrap narrow">
        {again ? <p className="hint">Sign in again to open your account.</p> : null}
        <StaffSignIn />
        <p className="or-divider">or</p>
        <p className="sign-in-alt">
          Do you need to request care? <Link href="/request">Click here</Link>
        </p>
      </div>
    </section>
  );
}
