'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/staff', label: 'Open' },
  { href: '/staff/archive', label: 'Archive' },
  { href: '/staff/notifications', label: 'Notifications' },
];

export function DeskNav() {
  const pathname = usePathname();

  return (
    <nav className="desk-nav" aria-label="Care team">
      {ITEMS.map((item) => {
        const current = item.href === '/staff'
          ? pathname === '/staff'
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
