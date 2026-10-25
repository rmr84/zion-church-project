import Link from 'next/link';
import { redirect } from 'next/navigation';
import { StaffSignIn } from '@/components/StaffSignIn';
import { isStaffSignedIn } from '@/lib/session';

export const metadata = { title: 'Care team sign in' };

export default async function StaffLoginPage() {
  if (await isStaffSignedIn()) redirect('/staff');

  return (
    <section className="page-frame">
      <div className="page-heading centered">
        <p className="eyebrow">Care team</p>
        <h1>Sign In</h1>
      </div>
      <div className="wrap narrow">
        <StaffSignIn />
        <p className="or-divider">or</p>
        <p className="sign-in-alt">
          Do you need to request care? <Link href="/request">Click here</Link>
        </p>
      </div>
    </section>
  );
}
