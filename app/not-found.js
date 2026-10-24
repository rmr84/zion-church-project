import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="page-frame">
      <div className="page-heading">
        <h1>That page is not here.</h1>
      </div>
      <div className="wrap narrow">
        <p><Link href="/">Back to the care desk</Link></p>
      </div>
    </section>
  );
}
