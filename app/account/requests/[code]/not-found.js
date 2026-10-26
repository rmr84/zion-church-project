import Link from 'next/link';

export default function RequesterRequestNotFound() {
  return (
    <section className="page-frame">
      <div className="page-heading">
        <h1>Request not found</h1>
        <p className="lede">That request is not on this account, or the link is incomplete.</p>
      </div>
      <div className="wrap narrow">
        <p>
          <Link href="/account">Back to My Requests</Link>
        </p>
      </div>
    </section>
  );
}
