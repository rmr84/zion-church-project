'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { DeskSearch } from '@/components/DeskSearch';
import { SiteMenu } from '@/components/SiteMenu';

const ITEMS = [
  {
    href: '/staff',
    label: 'Care requests',
    current: (pathname) => pathname === '/staff'
      || pathname.startsWith('/staff/requests')
      || pathname.startsWith('/staff/archive')
      || pathname.startsWith('/staff/notifications'),
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
    label: 'User management',
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

export function DeskMenu({ member, isAdmin = false }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [photoFailed, setPhotoFailed] = useState(false);
  const label = member?.label || 'Care team';

  const links = ITEMS.map((item) => (
    <Link key={item.href} href={item.href} aria-current={item.current(pathname) ? 'page' : undefined}>
      {item.icon}
      {item.label}
    </Link>
  ));

  return (
    <>
      <div className="desk-menu-phone">
        <SiteMenu dropdown>
          <nav className="primary-nav" aria-label="Care team">
            {ITEMS.map((item) => (
              <Link key={item.href} href={item.href} aria-current={item.current(pathname) ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
        </SiteMenu>
      </div>
      <div className={`desk-rail-slot${open ? ' is-open' : ''}`}>
        <aside id="desk-rail" className="desk-rail" inert={open ? undefined : true}>
          {isAdmin ? (
            <Link href="/staff" className="desk-rail-brand" aria-label="Zion Church">
              <img src="/zion-logo.png" alt="" width={293} height={80} />
            </Link>
          ) : null}
          <DeskSearch />
          <nav className="desk-rail-nav" aria-label="Care team">
            {links}
          </nav>
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
            <span>{label}</span>
          </Link>
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
