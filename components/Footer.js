import Link from 'next/link';
import { getRequester, isStaffSignedIn } from '@/lib/session';

export async function Footer() {
  const requester = await getRequester();
  const staff = await isStaffSignedIn();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {staff ? null : (
          <p>DISCLAIMER: Requests are only visible to the care team, not to other members.</p>
        )}
        {requester || staff ? null : <Link href="/staff/login">Care Team Sign In</Link>}
      </div>
    </footer>
  );
}
