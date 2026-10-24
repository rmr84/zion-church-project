import Link from 'next/link';

export const metadata = { title: 'Care desk' };

export default function HomePage() {
  return (
    <section className="wrap narrow">
      <p className="eyebrow">Pastoral care</p>
      <h1>A private way to ask for care.</h1>
      <p className="lede">
        Hospital visits, meals, counseling referrals, and prayer. You can leave your name off,
        and you can ask with an account or without one. The congregation cannot read what you send.
      </p>
      <div className="actions">
        <Link className="button" href="/request">Request care</Link>
        <Link className="button secondary" href="/status">Check a request</Link>
      </div>
      <p className="hint">
        <Link href="/sign-in">Sign in</Link>
        {' '}
        to see requests you send while signed in. The care team uses a separate sign-in.
      </p>
      <h2>How it works</h2>
      <ol className="steps">
        <li>Tell the care team what you need.</li>
        <li>Save the reference code. It is how you check back.</li>
        <li>The team updates the status. Notes meant only for them stay with them.</li>
      </ol>
      <p className="hint">If this is an emergency, call 911. This desk is not an emergency line.</p>
    </section>
  );
}
