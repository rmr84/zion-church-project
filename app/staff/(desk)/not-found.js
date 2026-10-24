import Link from "next/link";

export default function StaffNotFound() {
  return (
    <section className="wrap narrow">
      <h1>Request not found</h1>
      <p>That reference code is not on the care desk.</p>
      <p>
        <Link href="/staff">Back to open requests</Link>
      </p>
    </section>
  );
}
