'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/staff', label: 'Open' },
  { href: '/staff/archive', label: 'Archive' },
];

function isCareRequestPath(pathname) {
  return pathname === '/staff'
    || pathname.startsWith('/staff/archive')
    || pathname.startsWith('/staff/requests');
}

export function DeskNav() {
  const pathname = usePathname();
  if (!isCareRequestPath(pathname)) return null;

  return (
    <nav className="desk-nav" aria-label="Care Requests">
      {ITEMS.map((item) => {
        const current = item.href === '/staff'
          ? pathname === '/staff' || pathname.startsWith('/staff/requests')
          : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={current ? 'page' : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
