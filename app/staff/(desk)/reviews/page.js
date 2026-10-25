import { REVIEWS } from '@/lib/reviews';

export const metadata = { title: 'Reviews' };

export default function ReviewsPage() {
  return (
    <section className="page-frame">
      <div className="page-heading">
        <p className="eyebrow">Care Team</p>
        <h1>Reviews</h1>
        <p className="lede">What members say about the care desk.</p>
      </div>
      <div className="wrap wide reviews-desk">
        <ul className="reviews-desk-list">
          {REVIEWS.map((review) => (
            <li key={`${review.name}-${review.detail}`}>
              <blockquote>
                <p>{review.quote}</p>
                <footer>
                  <cite>{review.name}</cite>
                  <span>{review.detail}</span>
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
