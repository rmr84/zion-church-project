import Link from 'next/link';
import { logout } from '@/app/actions/staff';
import { SiteMenu } from '@/components/SiteMenu';
import { getRequester, isStaffSignedIn } from '@/lib/session';
import { getUser } from '@/lib/users';

export async function Header() {
  const staff = await isStaffSignedIn();
  const requester = await getRequester();
  const profile = requester ? await getUser(requester.uid).catch(() => null) : null;

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="wordmark" aria-label="Zion Church">
          <img src="/zion-logo.png" alt="" width={293} height={80} />
        </Link>
        <SiteMenu>
          <nav className="primary-nav" aria-label="Primary">
            <Link href="/request">Request Care</Link>
            <Link href="/status">Check Status</Link>
            {requester ? <Link href="/account">My Requests</Link> : <Link href="/sign-in">Sign In</Link>}
            {requester ? (
              <Link href="/account/settings" className="account-nav">
                {profile?.photoType ? (
                  <img src={`/api/profile-photo?v=${encodeURIComponent(profile.photoUpdatedAt)}`} alt="" width={28} height={28} />
                ) : (
                  <span className="account-nav-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="3.15" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M5.6 19.1c1.35-3.05 3.55-4.45 6.4-4.45s5.05 1.4 6.4 4.45" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                )}
                Account
              </Link>
            ) : null}
            {staff ? <Link href="/staff">Open queue</Link> : null}
            {staff ? (
              <form className="inline-form" action={logout}>
                <button className="text-button" type="submit">Sign out of desk</button>
              </form>
            ) : null}
          </nav>
        </SiteMenu>
      </div>
    </header>
  );
}
