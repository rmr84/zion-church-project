'use client';

export default function Error({ reset }) {
  return (
    <section className="wrap narrow">
      <h1>Something went wrong.</h1>
      <p>The care desk could not finish that. This screen does not include a care request.</p>
      <button className="button" type="button" onClick={() => reset()}>Try again</button>
    </section>
  );
}
