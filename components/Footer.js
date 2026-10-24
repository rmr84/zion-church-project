import Link from 'next/link';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>DISCLAIMER: Requests are only visible to the care team, not to other members.</p>
        <Link href="/staff/login">Care Team Sign In</Link>
      </div>
    </footer>
  );
}
