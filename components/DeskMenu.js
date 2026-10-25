'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SiteMenu } from '@/components/SiteMenu';

const ITEMS = [
  {
    href: '/staff',
    label: 'Care requests',
    current: (pathname) => pathname === '/staff'
      || pathname.startsWith('/staff/requests')
      || pathname.startsWith('/staff/archive')
      || pathname.startsWith('/staff/notifications'),
  },
  {
    href: '/staff/users',
    label: 'User management',
    current: (pathname) => pathname.startsWith('/staff/users'),
  },
  {
    href: '/staff/account',
    label: 'Account',
    current: (pathname) => pathname.startsWith('/staff/account'),
  },
];

export function DeskMenu() {
  const pathname = usePathname();

  return (
    <SiteMenu dropdown>
      <nav className="primary-nav" aria-label="Care team">
        {ITEMS.map((item) => (
          <Link key={item.href} href={item.href} aria-current={item.current(pathname) ? 'page' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
    </SiteMenu>
  );
}
