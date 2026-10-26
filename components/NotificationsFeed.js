'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { markAllDeskNotifications } from '@/app/actions/notifications';
import { useToast } from '@/components/Toast';
import { formatDay } from '@/lib/format';

function initials(value) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function shortDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  }).format(date);
}

function buildItems(assignments = [], reviews = []) {
  const assignmentItems = assignments.map((item) => ({
    id: `assignment-${item.id}`,
    href: `/staff/requests/${item.referenceCode}`,
    name: item.assignedBy || 'Care desk',
    date: item.createdAt,
    title: (
      <>
        <strong>{item.careLabel || 'Care request'}</strong>
        {' '}
        was assigned to you
      </>
    ),
    meta: item.referenceCode || '',
  }));
  const reviewItems = reviews.map((item) => ({
    id: `review-${item.id}`,
    href: '/staff/reviews',
    name: item.name || 'Anonymous',
    date: item.createdAt,
    title: item.quote || 'New review submitted',
    meta: [item.detail, item.referenceCode].filter(Boolean).join(' · '),
  }));
  return [...assignmentItems, ...reviewItems].sort((left, right) => (
    String(right.date || '').localeCompare(String(left.date || ''))
  ));
}

export function NotificationsFeed({
  assignments = [],
  reviews = [],
  isAdmin = false,
  titleId,
  onItemClick,
  onMarkedAll,
  compact = false,
}) {
  const router = useRouter();
  const showToast = useToast();
  const [pending, setPending] = useState(false);
  const items = buildItems(assignments, reviews);
  const canMarkAll = items.length > 0;

  async function onMarkAll() {
    if (!canMarkAll || pending) return;
    setPending(true);
    const result = await markAllDeskNotifications({ includeReviews: isAdmin });
    setPending(false);
    if (!result?.ok) {
      showToast?.(result?.formError || 'Those notifications could not be updated.');
      return;
    }
    showToast?.('All notifications marked as read.');
    onMarkedAll?.();
    router.refresh();
  }

  return (
    <div className={`desk-notifications-feed${compact ? ' is-compact' : ''}`}>
      <div className="desk-notifications-panel-head">
        <div>
          <h2 id={titleId}>Notifications</h2>
          <p>Assignments, reviews, and care desk updates</p>
        </div>
        {canMarkAll ? (
          <button
            className="desk-text-action"
            type="button"
            disabled={pending}
            onClick={onMarkAll}
          >
            {pending ? 'Saving…' : 'Mark all as read'}
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="desk-notifications-empty">You are all caught up.</p>
      ) : (
        <ul className="desk-notifications-list">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="desk-notification-item"
                onClick={() => onItemClick?.()}
              >
                <span className="desk-notification-avatar" aria-hidden="true">
                  {initials(item.name)}
                </span>
                <span className="desk-notification-body">
                  <span className="desk-notification-meta">
                    <span className="desk-notification-name">{item.name}</span>
                    <time dateTime={item.date} title={formatDay(item.date)}>
                      {shortDate(item.date)}
                    </time>
                  </span>
                  <span className="desk-notification-title">{item.title}</span>
                  {item.meta ? <span className="desk-notification-ref">{item.meta}</span> : null}
                </span>
                <span className="desk-notification-unread" aria-label="Unread" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
