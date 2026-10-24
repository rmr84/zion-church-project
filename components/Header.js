import Link from 'next/link';
import { logout } from '@/app/actions/staff';
import { SignOutButton } from '@/components/SignOutButton';
import { getRequester, isStaffSignedIn } from '@/lib/session';

export async function Header() {
  const staff = await isStaffSignedIn();
  const requester = await getRequester();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="wordmark" aria-label="Zion Church">
          <img src="/zion-logo.png" alt="" width={293} height={80} />
        </Link>
        <nav className="primary-nav" aria-label="Primary">
          <Link href="/request">Request Care</Link>
          <Link href="/status">Check Status</Link>
          {requester ? <Link href="/account">My Requests</Link> : <Link href="/sign-in">Sign In</Link>}
          {requester ? <SignOutButton /> : null}
          {staff ? <Link href="/staff">Open queue</Link> : null}
          {staff ? (
            <form className="inline-form" action={logout}>
              <button className="text-button" type="submit">Sign out of desk</button>
            </form>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
