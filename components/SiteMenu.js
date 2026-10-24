'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function SiteMenu({ children }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    function closeOnOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div className={`site-menu${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="primary-menu"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        {open ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )}
      </button>
      <div className="site-menu-panel" id="primary-menu">
        {children}
      </div>
    </div>
  );
}
