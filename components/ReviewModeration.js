'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { approveReview } from '@/app/actions/reviews';
import { useToast } from '@/components/Toast';

export function ReviewModeration({ reviews = [] }) {
  const router = useRouter();
  const showToast = useToast();
  const [pendingId, setPendingId] = useState('');

  const pending = reviews.filter((review) => review.status === 'pending');
  const approved = reviews.filter((review) => review.status !== 'pending');

  async function onApprove(id) {
    if (pendingId) return;
    setPendingId(id);
    const result = await approveReview(id);
    setPendingId('');
    if (!result?.ok) {
      showToast?.(result?.formError || 'That review could not be approved.');
      return;
    }
    showToast?.('Review approved.');
    router.refresh();
  }

  if (reviews.length === 0) {
    return <p className="empty">No reviews are on file yet.</p>;
  }

  return (
    <div className="reviews-desk">
      {pending.length > 0 ? (
        <section className="reviews-desk-section">
          <h2>Pending</h2>
          <ul className="reviews-desk-list">
            {pending.map((review) => (
              <li key={review.id || `${review.name}-${review.createdAt}`}>
                <blockquote>
                  <p>{review.quote}</p>
                  <footer>
                    <cite>{review.name}</cite>
                    <span>{review.detail}</span>
                    {review.referenceCode ? <span>{review.referenceCode}</span> : null}
                  </footer>
                </blockquote>
                <button
                  className="button"
                  type="button"
                  disabled={pendingId === review.id}
                  onClick={() => onApprove(review.id)}
                >
                  {pendingId === review.id ? 'Saving…' : 'Approve'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="reviews-desk-section">
        <h2>Approved</h2>
        {approved.length === 0 ? (
          <p className="empty">No approved reviews yet.</p>
        ) : (
          <ul className="reviews-desk-list">
            {approved.map((review) => (
              <li key={review.id || `${review.name}-${review.createdAt}`}>
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
      </section>
    </div>
  );
}
