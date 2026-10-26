import { listReviews } from '@/lib/reviews';

export const metadata = { title: 'Reviews' };

export default async function ReviewsPage() {
  const reviews = await listReviews();

  return (
    <section className="page-frame">
      <div className="page-heading">
        <h1>Reviews</h1>
      </div>
      <div className="wrap wide reviews-desk">
        {reviews.length === 0 ? (
          <p className="empty">No reviews are on file yet.</p>
        ) : (
          <ul className="reviews-desk-list">
            {reviews.map((review) => (
              <li key={`${review.name}-${review.detail}-${review.createdAt}`}>
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
        )}
      </div>
    </section>
  );
}
