'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { MemberAvatar } from '@/components/MemberAvatar';
import { activeMembers, findMember, memberLabel, memberValue } from '@/lib/members';

export function MemberPicker({
  id,
  name,
  members,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select a member',
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();
  const options = activeMembers(members);
  const selected = value
    ? (findMember(members, value) || options.find((member) => memberValue(member) === value) || null)
    : null;

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

  function choose(member) {
    const next = memberValue(member);
    onChange?.(next === value ? '' : next);
    setOpen(false);
  }

  return (
    <div className={`member-picker${open ? ' is-open' : ''}`} ref={rootRef}>
      {name ? <input type="hidden" name={name} value={value || ''} /> : null}
      <button
        id={id}
        className="member-picker-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        {selected ? (
          <>
            <MemberAvatar member={selected} className="member-picker-avatar" />
            <span className="member-picker-label">{memberLabel(selected)}</span>
          </>
        ) : value ? (
          <span className="member-picker-label">{value}</span>
        ) : (
          <span className="member-picker-placeholder">{placeholder}</span>
        )}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <ul className="member-picker-menu" id={listId} role="listbox" aria-label="Care Team Member">
          {options.map((member) => {
            const option = memberValue(member);
            const checked = Boolean(selected && memberValue(selected) === option);
            return (
              <li key={member.uid || member.email} role="option" aria-selected={checked}>
                <button type="button" onClick={() => choose(member)}>
                  <span className={`member-picker-check${checked ? ' is-on' : ''}`} aria-hidden="true">
                    {checked ? (
                      <svg viewBox="0 0 24 24">
                        <path d="M5.5 12.5 10 17l8.5-9.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                  <MemberAvatar member={member} className="member-picker-avatar" />
                  <span className="member-picker-label">{memberLabel(member)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
