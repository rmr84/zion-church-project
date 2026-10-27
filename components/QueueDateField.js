'use client';

import { useEffect, useId, useState } from 'react';

function toDisplay(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const [year, month, day] = value.split('-');
  return `${month}/${day}/${year}`;
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10h17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function QueueDateField({
  label,
  value = '',
  onChange,
  min,
  max,
}) {
  const inputId = useId();
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 759px)');
    function apply() {
      setPhone(media.matches);
    }
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  if (!phone) {
    return (
      <label className="queue-date-field" htmlFor={inputId}>
        <span>{label}</span>
        <input
          id={inputId}
          type="date"
          value={value}
          min={min || undefined}
          max={max || undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  const display = toDisplay(value);

  return (
    <label className="queue-date-field is-mobile" htmlFor={inputId}>
      <span>{label}</span>
      <span className="queue-date-shell">
        <span className={`queue-date-display${display ? '' : ' is-empty'}`}>
          {display || 'mm/dd/yyyy'}
        </span>
        <span className="queue-date-icon" aria-hidden="true">
          <CalendarIcon />
        </span>
        <input
          id={inputId}
          className="queue-date-native"
          type="date"
          value={value}
          min={min || undefined}
          max={max || undefined}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
        />
      </span>
    </label>
  );
}
