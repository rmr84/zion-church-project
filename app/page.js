import Link from 'next/link';

export const metadata = { title: 'Care desk' };

export default function HomePage() {
  return (
    <section className="wrap home">
      <p className="eyebrow">Pastoral care</p>
      <h1>Submit a Request for Care.</h1>
      <p className="lede">
        Request a hospital visit, a meal, a counseling referral, or prayer.
        Your name is optional, and so is an account. Only the care team can read what you send.
      </p>
      <div className="actions">
        <Link className="button" href="/request">Request Care</Link>
        <Link className="button secondary" href="/status">Check a Request</Link>
      </div>
     
      <h2>How It Works</h2>
      <ol className="steps">
        <li>Tell the care team what you need.</li>
        <li>Save the reference code to check back on your request.</li>
        <li>The care team updates the status and follows through on your request.</li>
      </ol>
      <p className="hint">If this is an emergency, call 911. This desk is not an emergency line.</p>
    </section>
  );
}
