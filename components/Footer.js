import Link from 'next/link';
import { getRequester } from '@/lib/session';

export async function Footer() {
  const requester = await getRequester();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>DISCLAIMER: Requests are only visible to the care team, not to other members.</p>
        {requester ? null : <Link href="/staff/login">Care Team Sign In</Link>}
      </div>
    </footer>
  );
}
