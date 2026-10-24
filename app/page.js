import Link from 'next/link';
import { Reveal } from '@/components/Reveal';
import { ReviewCarousel } from '@/components/ReviewCarousel';

export const metadata = { title: 'Care Desk' };

const REVIEWS = [
  {
    quote: 'Someone from the team brought dinner the week I came home. I only had to ask once.',
    name: 'Naomi',
    detail: 'Meal delivery',
  },
  {
    quote: 'I left my name off the request. They still prayed, and the note I got back was kind.',
    name: 'Anonymous',
    detail: 'Prayer support',
  },
  {
    quote: 'They visited my father in the hospital and updated the status so I knew it had happened.',
    name: 'Helen',
    detail: 'Hospital visit',
  },
  {
    quote: 'They helped me find a counselor and checked in after the first appointment.',
    name: 'Grace',
    detail: 'Counseling referral',
  },
  {
    quote: 'I asked for a visit for my neighbor. The team was gentle and kept it quiet.',
    name: 'Thomas',
    detail: 'Care visit',
  },
  {
    quote: 'The reference code made it easy to see that someone had picked up the request.',
    name: 'Miriam',
    detail: 'Follow-up',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="wrap home home-hero">
        <div className="hero-layout">
          <div>
            <p className="eyebrow">Pastoral care</p>
            <h1>Submit a Request for Care.</h1>
            <p className="lede">
              Request a hospital visit, a meal, a counseling referral, or prayer.
              Your name is optional, and so is an account. Only the care team can read what you send.
            </p>
          </div>
          <div className="hero-frame">
            <img
              className="hero-photo"
              src="/zion-building.jpg"
              alt="Zion Church sign on the building"
              width={447}
              height={447}
            />
          </div>
        </div>
        <div className="hero-frame hero-banner-frame">
          <img
            className="hero-banner"
            src="/zion-banner.jpg"
            alt="Experience. Engage. Equip. Empower."
            width={738}
            height={246}
          />
        </div>
        <p className="scroll-cue"></p>
      </section>

      <section className="wrap home home-flow">
        <Reveal>
          <h2 className="rise">How It Works</h2>
          <ol className="steps">
            <li className="rise">Tell the care team what you need.</li>
            <li className="rise">Save the reference code to check back on your request.</li>
            <li className="rise">The care team updates the status and follows through on your request.</li>
          </ol>
          <div className="actions rise">
            <Link className="button" href="/request">Request Care</Link>
            <Link className="button secondary" href="/status">Check a Request</Link>
          </div>
          <p className="hint">If this is an emergency, call 911. This desk is not an emergency line.</p>
        </Reveal>
      </section>

      <section className="wrap home home-reviews">
        <Reveal>
          <h2 className="rise">What Members Say</h2>
          <ReviewCarousel reviews={REVIEWS} />
        </Reveal>
      </section>
    </>
  );
}
