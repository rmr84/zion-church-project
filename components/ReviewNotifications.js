'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { markAllReviewsSeen, markReviewSeen } from '@/app/actions/reviews';
import { useToast } from '@/components/Toast';

export function ReviewNotifications({ notifications = [], canModerate = false }) {
  const router = useRouter();
  const showToast = useToast();
  const [pendingId, setPendingId] = useState('');
  const [pendingAll, setPendingAll] = useState(false);

  async function onMarkSeen(id) {
    if (!canModerate || pendingId || pendingAll) return;
    setPendingId(id);
    const result = await markReviewSeen(id);
    setPendingId('');
    if (!result?.ok) {
      showToast?.(result?.formError || 'That notification could not be updated.');
      return;
    }
    showToast?.('Marked as seen.');
    router.refresh();
  }

  async function onMarkAll() {
    if (!canModerate || pendingId || pendingAll) return;
    setPendingAll(true);
    const result = await markAllReviewsSeen();
    setPendingAll(false);
    if (!result?.ok) {
      showToast?.(result?.formError || 'Those notifications could not be updated.');
      return;
    }
    showToast?.('All review notifications marked as seen.');
    router.refresh();
  }

  if (notifications.length === 0) {
    return (
      <p className="empty">No new review notifications. Submitted feedback will show up here.</p>
    );
  }

  return (
    <div className="review-notifications">
      <div className="review-notifications-head">
        <p className="lede review-notifications-count">
          {notifications.length === 1
            ? '1 new review is waiting.'
            : `${notifications.length} new reviews are waiting.`}
        </p>
        {canModerate ? (
          <button className="button secondary" type="button" disabled={pendingAll} onClick={onMarkAll}>
            {pendingAll ? 'Saving…' : 'Mark All As Seen'}
          </button>
        ) : null}
      </div>
      <ul className="reviews-desk-list">
        {notifications.map((review) => (
          <li key={review.id}>
            <blockquote>
              <p>{review.quote}</p>
              <footer>
                <cite>{review.name}</cite>
                <span>{review.detail}</span>
                {review.referenceCode ? <span>{review.referenceCode}</span> : null}
              </footer>
            </blockquote>
            <div className="review-notification-actions">
              <Link className="button secondary" href="/staff/reviews">Review</Link>
              {canModerate ? (
                <button
                  className="button"
                  type="button"
                  disabled={pendingId === review.id}
                  onClick={() => onMarkSeen(review.id)}
                >
                  {pendingId === review.id ? 'Saving…' : 'Mark As Seen'}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
