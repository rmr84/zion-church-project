import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CreateAccount } from '@/components/CreateAccount';
import { getRequester } from '@/lib/session';

export const metadata = { title: 'Create an account' };

export default async function CreateAccountPage() {
  if (await getRequester()) redirect('/account');

  return (
    <section className="wrap narrow">
      <p className="eyebrow">Care requester</p>
      <h1>Create an account</h1>
      <p className="lede">
        An account keeps the requests you send while you are signed in. A confirmation email finishes the account.
      </p>
      <CreateAccount />
      <p className="sign-in-alt account-prompt">
        Already Have an Account? <Link href="/sign-in"><em>Sign In</em></Link>
      </p>
    </section>
  );
}
