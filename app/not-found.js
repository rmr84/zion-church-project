import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="wrap narrow">
      <h1>That page is not here.</h1>
      <p><Link href="/">Back to the care desk</Link></p>
    </section>
  );
}
