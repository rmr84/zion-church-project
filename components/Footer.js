import Link from 'next/link';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>Requests are visible to the care team, not to other members.</p>
        <Link href="/staff/login">Care team sign in</Link>
      </div>
    </footer>
  );
}
