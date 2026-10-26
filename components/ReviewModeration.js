'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { approveReview, rejectReview } from '@/app/actions/reviews';
import { useToast } from '@/components/Toast';

const FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];
const PAGE_SIZE = 5;
const MIN_APPROVED_REVIEWS = 6;

const CONFIRM = {
  approve: {
    title: 'Approve Review',
    body: 'Approving this review will show it in the carousel on the homepage.',
    confirmLabel: 'Approve',
    toast: 'Review approved.',
  },
  reject: {
    title: 'Reject Review',
    body: 'Are you sure you want to reject this review? If you change your mind, it will show under the Rejected Tab.',
    confirmLabel: 'Reject',
    toast: 'Review rejected.',
  },
  remove: {
    title: 'Remove Review',
    body: 'Are you sure you want to remove this review from the carousel on the homepage?',
    confirmLabel: 'Remove',
    toast: 'Review removed.',
  },
};

export function ReviewModeration({ reviews = [] }) {
  const router = useRouter();
  const showToast = useToast();
  const titleId = useId();
  const dialogRef = useRef(null);
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const approvedCount = useMemo(
    () => reviews.filter((review) => review.status === 'approved').length,
    [reviews],
  );
  const canRemoveApproved = approvedCount > MIN_APPROVED_REVIEWS;

  const visible = useMemo(
    () => reviews.filter((review) => review.status === filter),
    [reviews, filter],
  );

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const paged = visible.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  const copy = confirm ? CONFIRM[confirm.kind] : null;

  useEffect(() => {
    setPage(0);
  }, [filter]);

  useEffect(() => {
    setPage((value) => Math.min(value, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirm && !dialog.open) dialog.showModal();
    if (!confirm && dialog.open) dialog.close();
  }, [confirm]);

  function closeConfirm() {
    if (busy) return;
    setConfirm(null);
  }

  function askApprove(review) {
    if (busy || review.status === 'approved') return;
    setConfirm({ kind: 'approve', id: review.id });
  }

  function askReject(review) {
    if (busy || review.status === 'rejected') return;
    if (review.status === 'approved' && !canRemoveApproved) {
      showToast?.(`Keep at least ${MIN_APPROVED_REVIEWS} approved reviews for the homepage carousel.`);
      return;
    }
    setConfirm({
      kind: review.status === 'approved' ? 'remove' : 'reject',
      id: review.id,
    });
  }

  async function confirmAction() {
    if (!confirm || busy) return;
    setBusy(true);
    const result = confirm.kind === 'approve'
      ? await approveReview(confirm.id)
      : await rejectReview(confirm.id);
    setBusy(false);
    if (!result?.ok) {
      showToast?.(result?.formError || 'That review could not be updated.');
      return;
    }
    showToast?.(CONFIRM[confirm.kind].toast);
    setConfirm(null);
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
        <>
          <ul className="reviews-desk-list">
            {paged.map((review) => (
              <li key={review.id || `${review.name}-${review.createdAt}`} className="review-card">
                <div className="review-card-actions">
                  <button
                    className="review-card-action is-approve"
                    type="button"
                    aria-label="Approve review"
                    disabled={busy || review.status === 'approved'}
                    onClick={() => askApprove(review)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 12.5l4.2 4.2L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    className="review-card-action is-reject"
                    type="button"
                    aria-label={review.status === 'approved' ? 'Remove review' : 'Reject review'}
                    title={
                      review.status === 'approved' && !canRemoveApproved
                        ? `Keep at least ${MIN_APPROVED_REVIEWS} approved reviews for the homepage carousel.`
                        : undefined
                    }
                    disabled={
                      busy
                      || review.status === 'rejected'
                      || (review.status === 'approved' && !canRemoveApproved)
                    }
                    onClick={() => askReject(review)}
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
          {pageCount > 1 ? (
            <nav className="request-pager" aria-label={`${filter} review pages`}>
              <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0}>
                Previous
              </button>
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-current={index === currentPage ? 'page' : undefined}
                  onClick={() => setPage(index)}
                >
                  {index + 1}
                </button>
              ))}
              <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount - 1}>
                Next
              </button>
            </nav>
          ) : null}
        </>
      )}

      <dialog
        ref={dialogRef}
        className="sign-out-dialog review-confirm-dialog"
        aria-labelledby={titleId}
        onClose={closeConfirm}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeConfirm();
        }}
      >
        {copy ? (
          <>
            <div className="sign-out-head">
              <span className="sign-out-icon" aria-hidden="true">
                {confirm.kind === 'approve' ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12.5l4.2 4.2L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                )}
              </span>
              <button className="sign-out-close" type="button" aria-label="Close" onClick={closeConfirm}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <h2 id={titleId}>{copy.title}</h2>
            <p>{copy.body}</p>
            <div className="modal-actions">
              <button className="button secondary" type="button" disabled={busy} onClick={closeConfirm}>
                Cancel
              </button>
              <button className="button" type="button" disabled={busy} onClick={confirmAction}>
                {busy ? 'Saving…' : copy.confirmLabel}
              </button>
            </div>
          </>
        ) : null}
      </dialog>
    </div>
  );
}
