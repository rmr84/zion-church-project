'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { RoleBadge } from '@/components/Badges';

const ROLES = [
  { value: 'careTeam', label: 'Care Team' },
  { value: 'Admin', label: 'Admin' },
];

export function RolePicker({
  role,
  disabled = false,
  onChange,
  id,
  'aria-labelledby': ariaLabelledBy,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();
  const selected = ROLES.find((item) => item.value === role) || ROLES[0];

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

  function choose(value) {
    setOpen(false);
    if (value !== role) onChange?.(value);
  }

  return (
    <div className={`role-picker${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        id={id}
        className="role-picker-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <RoleBadge role={selected.label} />
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <ul className="role-picker-menu" id={listId} role="listbox" aria-label="Role">
          {ROLES.map((item) => (
            <li key={item.value} role="option" aria-selected={item.value === role}>
              <button type="button" onClick={() => choose(item.value)}>
                <RoleBadge role={item.label} />
                <span className="sr-only">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
