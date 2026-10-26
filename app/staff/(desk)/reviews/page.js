import { ReviewModeration } from '@/components/ReviewModeration';
import { listDeskReviews } from '@/lib/reviews';

export const metadata = { title: 'Reviews' };

export default async function ReviewsPage() {
  const reviews = await listDeskReviews();

  return (
    <section className="page-frame">
      <div className="page-heading">
        <h1>Reviews</h1>
      </div>
      <div className="wrap wide">
        <ReviewModeration reviews={reviews} />
      </div>
    </section>
  );
}
