'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { searchCareRequests } from '@/app/actions/staff';
import { CARE_TYPES, labelFor } from '@/lib/constants';

const requestIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="3.5" width="14" height="17" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ACTIONS = [
  {
    href: '/staff',
    title: 'Care Requests',
    detail: 'View and manage open care requests.',
    icon: requestIcon,
  },
  {
    href: '/staff/reviews',
    title: 'Reviews',
    detail: 'Read what members say about the care desk.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7.5h10M7 12h10M7 16.5h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="4.5" y="4" width="15" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    href: '/staff/users',
    title: 'User Management',
    detail: 'View care team and admin members.',
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
    title: 'Email Logs',
    detail: 'Review outbound requester and invite emails.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4.2 7.2 12 12.4 19.8 7.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/staff/account',
    title: 'Account',
    detail: 'View and update the information on this account.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="3.15" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5.6 19.1c1.35-3.05 3.55-4.45 6.4-4.45s5.05 1.4 6.4 4.45" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/staff/notifications',
    title: 'Notifications',
    detail: 'Desk alerts for assignments and new reviews.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4.2 1.5 5.5 1.5 5.5H5s1.5-1.3 1.5-5.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M10 18.2a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function DeskSearch() {
  const router = useRouter();
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [active, setActive] = useState(0);

  const term = query.trim().toLowerCase();
  const actions = ACTIONS.filter((action) => !term || `${action.title} ${action.detail}`.toLowerCase().includes(term));
  const requests = term.length < 2 || !results ? [] : results.map((result) => ({
    href: `/staff/requests/${result.referenceCode}`,
    title: labelFor(CARE_TYPES, result.careType),
    detail: `${result.name} · ${result.referenceCode}`,
    icon: requestIcon,
    group: 'Care Requests',
  }));
  const choices = [
    ...actions.map((action) => ({ ...action, group: 'Common Actions' })),
    ...requests,
  ];
  const index = choices.length === 0 ? 0 : Math.min(active, choices.length - 1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
    return undefined;
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return undefined;
    const needle = query.trim();
    if (needle.length < 2) return undefined;
    let activeSearch = true;
    const timer = setTimeout(async () => {
      const rows = await searchCareRequests(needle);
      if (activeSearch) setResults(rows);
    }, 250);
    return () => {
      activeSearch = false;
      clearTimeout(timer);
    };
  }, [open, query]);

  useEffect(() => {
    document.getElementById(`palette-choice-${index}`)?.scrollIntoView({ block: 'nearest' });
  }, [index, choices.length]);

  function show() {
    setQuery('');
    setResults(null);
    setActive(0);
    setOpen(true);
  }

  function choose(choice) {
    if (!choice) return;
    setOpen(false);
    router.push(choice.href);
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(choices.length === 0 ? 0 : (index + 1) % choices.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(choices.length === 0 ? 0 : (index - 1 + choices.length) % choices.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(choices[index]);
    }
  }

  const dialog = (
    <dialog
      ref={dialogRef}
      className="command-palette"
      aria-label="Search"
      onClose={() => setOpen(false)}
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
      onKeyDown={onKeyDown}
    >
      <form
        className="palette-search"
        onSubmit={(event) => {
          event.preventDefault();
          choose(choices[index]);
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M15.5 15.5 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search"
          value={query}
          aria-label="Search care requests"
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            if (event.target.value.trim().length < 2) setResults(null);
          }}
        />
      </form>
      <div className="palette-list">
        {choices.map((choice, choiceIndex) => (
          <div key={choice.href}>
            {choice.group !== choices[choiceIndex - 1]?.group ? <p className="palette-label">{choice.group}</p> : null}
            <button
              id={`palette-choice-${choiceIndex}`}
              type="button"
              className={choiceIndex === index ? 'is-active' : ''}
              onMouseEnter={() => setActive(choiceIndex)}
              onClick={() => choose(choice)}
            >
              <span className="palette-icon">{choice.icon}</span>
              <span>
                <strong>{choice.title}</strong>
                <span>{choice.detail}</span>
              </span>
            </button>
          </div>
        ))}
        {term.length >= 2 && results === null ? <p className="palette-note">Searching…</p> : null}
        {term.length >= 2 && results && choices.length === 0 ? <p className="palette-note">No matches.</p> : null}
      </div>
      <p className="palette-help">
        <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
        <span><kbd>↵</kbd> to select</span>
        <span><kbd>esc</kbd> to close</span>
      </p>
    </dialog>
  );

  return (
    <>
      <div className="desk-search">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M15.5 15.5 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <button className="desk-search-trigger" type="button" onClick={show}>Search</button>
      </div>
      {mounted ? createPortal(dialog, document.body) : null}
    </>
  );
}
