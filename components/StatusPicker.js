'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { StatusBadge } from '@/components/Badges';
import { DESK_STATUSES, statusLabel } from '@/lib/constants';

export function StatusPicker({
  status,
  disabled = false,
  onChange,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();

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
    if (value !== status) onChange?.(value);
  }

  return (
    <div className={`status-picker${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        className="status-picker-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <StatusBadge status={status} desk />
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <ul className="status-picker-menu" id={listId} role="listbox" aria-label="Status">
          {DESK_STATUSES.map((item) => (
            <li key={item.value} role="option" aria-selected={item.value === status}>
              <button type="button" onClick={() => choose(item.value)}>
                <StatusBadge status={item.value} desk />
                <span className="sr-only">{statusLabel(item.value, { desk: true })}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
