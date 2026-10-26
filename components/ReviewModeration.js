'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { approveReview, rejectReview } from '@/app/actions/reviews';
import { useToast } from '@/components/Toast';

const FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export function ReviewModeration({ reviews = [] }) {
  const router = useRouter();
  const showToast = useToast();
  const [filter, setFilter] = useState('pending');
  const [busyId, setBusyId] = useState('');

  const visible = useMemo(
    () => reviews.filter((review) => review.status === filter),
    [reviews, filter],
  );

  async function onApprove(id) {
    if (busyId) return;
    setBusyId(id);
    const result = await approveReview(id);
    setBusyId('');
    if (!result?.ok) {
      showToast?.(result?.formError || 'That review could not be approved.');
      return;
    }
    showToast?.('Review approved.');
    router.refresh();
  }

  async function onReject(id) {
    if (busyId) return;
    setBusyId(id);
    const result = await rejectReview(id);
    setBusyId('');
    if (!result?.ok) {
      showToast?.(result?.formError || 'That review could not be rejected.');
      return;
    }
    showToast?.('Review rejected.');
    router.refresh();
  }

  if (reviews.length === 0) {
    return <p className="empty">No reviews are on file yet.</p>;
  }

  return (
    <div className="reviews-desk">
      <div className="queue-switch review-status-filter" role="group" aria-label="Review status">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="empty">No {filter} reviews.</p>
      ) : (
        <ul className="reviews-desk-list">
          {visible.map((review) => (
            <li key={review.id || `${review.name}-${review.createdAt}`} className="review-card">
              <div className="review-card-actions">
                <button
                  className="review-card-action is-approve"
                  type="button"
                  aria-label="Approve review"
                  disabled={busyId === review.id || review.status === 'approved'}
                  onClick={() => onApprove(review.id)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12.5l4.2 4.2L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  className="review-card-action is-reject"
                  type="button"
                  aria-label="Reject review"
                  disabled={busyId === review.id || review.status === 'rejected'}
                  onClick={() => onReject(review.id)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <blockquote>
                <p>{review.quote}</p>
                <footer>
                  <cite>{review.name}</cite>
                  <span>{review.detail}</span>
                  {review.referenceCode ? <span>{review.referenceCode}</span> : null}
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
