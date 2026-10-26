'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { DeskSearch } from '@/components/DeskSearch';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { SiteMenu } from '@/components/SiteMenu';

const ITEMS = [
  {
    href: '/staff',
    label: 'Care Requests',
    current: (pathname) => pathname === '/staff'
      || pathname.startsWith('/staff/requests')
      || pathname.startsWith('/staff/archive'),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="3.5" width="14" height="17" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/staff/reviews',
    label: 'Reviews',
    current: (pathname) => pathname.startsWith('/staff/reviews'),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7.5h10M7 12h10M7 16.5h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="4.5" y="4" width="15" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    href: '/staff/users',
    label: 'User Management',
    current: (pathname) => pathname.startsWith('/staff/users'),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="9" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4.8 17.2c.8-2.2 2.3-3.3 4.2-3.3s3.4 1.1 4.2 3.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="16.2" cy="9.2" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M15.2 13.9c1.7.15 2.9 1.15 3.7 3.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/staff/email-logs',
    label: 'Email Logs',
    current: (pathname) => pathname.startsWith('/staff/email-logs'),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4.2 7.2 12 12.4 19.8 7.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/staff/account',
    label: 'Account',
    current: (pathname) => pathname.startsWith('/staff/account'),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="3.15" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5.6 19.1c1.35-3.05 3.55-4.45 6.4-4.45s5.05 1.4 6.4 4.45" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

function NotificationBadge({ count }) {
  if (!count) return null;
  const label = count > 99 ? '99+' : String(count);
  return (
    <span className="desk-note-badge" aria-label={`${label} new notifications`}>
      {label}
    </span>
  );
}

export function DeskMenu({
  member,
  notificationCount = 0,
  assignmentNotifications = [],
  reviewNotifications = [],
  isAdmin = false,
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const label = member?.label || 'Care Team';

  const links = ITEMS.map((item) => (
    <Link key={item.href} href={item.href} aria-current={item.current(pathname) ? 'page' : undefined}>
      {item.icon}
      {item.label}
    </Link>
  ));

  return (
    <>
      <div className="desk-menu-phone">
        <SiteMenu dropdown badgeCount={notificationCount}>
          <nav className="primary-nav" aria-label="Care Team">
            {ITEMS.map((item) => (
              <Link key={item.href} href={item.href} aria-current={item.current(pathname) ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
            <Link
              href="/staff/notifications"
              className="desk-phone-notifications"
              aria-current={pathname.startsWith('/staff/notifications') ? 'page' : undefined}
            >
              <span>Notifications</span>
              <NotificationBadge count={notificationCount} />
            </Link>
          </nav>
        </SiteMenu>
      </div>
      <div className={`desk-rail-slot${open ? ' is-open' : ''}`}>
        <aside id="desk-rail" className="desk-rail" inert={open ? undefined : true}>
          <Link href="/staff" className="desk-rail-brand" aria-label="Zion Church">
            <img src="/zion-logo.png" alt="" width={293} height={80} />
          </Link>
          <DeskSearch />
          <nav className="desk-rail-nav" aria-label="Care Team">
            {links}
          </nav>
          <div className="desk-rail-foot">
            <div className="desk-note-wrap">
              <button
                type="button"
                className={`desk-rail-note${notesOpen ? ' is-open' : ''}`}
                aria-expanded={notesOpen}
                aria-haspopup="dialog"
                onClick={() => setNotesOpen((current) => !current)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4.2 1.5 5.5 1.5 5.5H5s1.5-1.3 1.5-5.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M10 18.2a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span className="desk-rail-note-label">
                  Notifications
                  <NotificationBadge count={notificationCount} />
                </span>
              </button>
              <NotificationsPanel
                open={notesOpen}
                onClose={() => setNotesOpen(false)}
                assignments={assignmentNotifications}
                reviews={reviewNotifications}
                isAdmin={isAdmin}
              />
            </div>
            <Link href="/staff/account" className="desk-rail-user" aria-current={pathname.startsWith('/staff/account') ? 'page' : undefined}>
              {member?.photo && !photoFailed ? (
                <img
                  src={`/api/profile-photo?desk=1&v=${encodeURIComponent(member.photoUpdatedAt)}`}
                  alt=""
                  width={36}
                  height={36}
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <span className="desk-rail-avatar" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="3.15" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M5.6 19.1c1.35-3.05 3.55-4.45 6.4-4.45s5.05 1.4 6.4 4.45" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
              )}
              <span className="desk-rail-user-name">{label}</span>
              <span className="desk-rail-online" title="Online" aria-label="Online" />
            </Link>
          </div>
        </aside>
        <button
          className="desk-rail-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="desk-rail"
          onClick={() => setOpen((current) => !current)}
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 6.5 8.5 12 14 17.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </>
  );
}
