import { ReviewModeration } from '@/components/ReviewModeration';
import { listDeskReviews } from '@/lib/reviews';
import { getStaff } from '@/lib/session';
import { ADMIN_ROLE, getUserRole } from '@/lib/users';

export const metadata = { title: 'Reviews' };

export default async function ReviewsPage() {
  const [reviews, staff] = await Promise.all([
    listDeskReviews(),
    getStaff(),
  ]);
  const role = staff ? await getUserRole(staff.uid) : '';

  return (
    <section className="page-frame">
      <div className="page-heading">
        <h1>Reviews</h1>
      </div>
      <div className="wrap wide">
        <ReviewModeration reviews={reviews} canModerate={role === ADMIN_ROLE} />
      </div>
    </section>
  );
}
