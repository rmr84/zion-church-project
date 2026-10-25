'use client';

import { useEffect, useRef, useState } from 'react';
import { CARE_TYPES, DESK_STATUSES, URGENCY_LEVELS } from '@/lib/constants';
import { UNASSIGNED, memberLabel, memberValue } from '@/lib/members';

export function QueueFilters({
  query,
  onQueryChange,
  archive,
  onArchiveChange,
  urgencies,
  onUrgenciesChange,
  careTypes,
  onCareTypesChange,
  statuses,
  onStatusesChange,
  assignees,
  onAssigneesChange,
  members = [],
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const statusOptions = DESK_STATUSES.filter((item) => (
    archive ? item.value === 'completed' : item.value !== 'completed'
  ));

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

  function toggle(list, value, onChange) {
    onChange(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function FilterOption({ checked, label, onClick }) {
    return (
      <button
        type="button"
        role="menuitemcheckbox"
        aria-checked={checked}
        onClick={onClick}
      >
        <span className={`queue-filter-check${checked ? ' is-on' : ''}`} aria-hidden="true">
          {checked ? (
            <svg viewBox="0 0 24 24">
              <path d="M5.5 12.5 10 17l8.5-9.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
        {label}
      </button>
    );
  }

  const pills = [
    ...urgencies.map((value) => ({
      key: `urgency-${value}`,
      label: URGENCY_LEVELS.find((item) => item.value === value)?.label || value,
      clear: () => onUrgenciesChange(urgencies.filter((item) => item !== value)),
    })),
    ...careTypes.map((value) => ({
      key: `care-${value}`,
      label: CARE_TYPES.find((item) => item.value === value)?.label || value,
      clear: () => onCareTypesChange(careTypes.filter((item) => item !== value)),
    })),
    ...statuses.map((value) => ({
      key: `status-${value}`,
      label: DESK_STATUSES.find((item) => item.value === value)?.label || value,
      clear: () => onStatusesChange(statuses.filter((item) => item !== value)),
    })),
    ...assignees.map((value) => ({
      key: `assignee-${value}`,
      label: value === UNASSIGNED
        ? 'Unassigned'
        : memberLabel(members.find((member) => memberValue(member) === value) || { label: value }),
      clear: () => onAssigneesChange(assignees.filter((item) => item !== value)),
    })),
  ];

  return (
    <div className="queue-filters" ref={rootRef}>
      <div className="queue-toolbar">
        <label className="queue-search">
          <span className="sr-only">Search care requests</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M15.5 15.5 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            autoComplete="off"
          />
        </label>

        <div className="queue-switch" role="group" aria-label="Request view">
          <button type="button" aria-pressed={!archive} onClick={() => onArchiveChange(false)}>
            Active
          </button>
          <button type="button" aria-pressed={archive} onClick={() => onArchiveChange(true)}>
            Archive
          </button>
        </div>

        <div className="queue-filter">
          <button
            className="queue-filter-button"
            type="button"
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => setOpen((current) => !current)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16M7 12h10M10 18h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Filter
          </button>
          {open ? (
            <div className="queue-filter-menu" role="menu">
              <p className="queue-filter-label">Urgency</p>
              {URGENCY_LEVELS.map((item) => (
                <FilterOption
                  key={item.value}
                  checked={urgencies.includes(item.value)}
                  label={item.label}
                  onClick={() => toggle(urgencies, item.value, onUrgenciesChange)}
                />
              ))}
              <p className="queue-filter-label">Type of Care</p>
              {CARE_TYPES.map((item) => (
                <FilterOption
                  key={item.value}
                  checked={careTypes.includes(item.value)}
                  label={item.label}
                  onClick={() => toggle(careTypes, item.value, onCareTypesChange)}
                />
              ))}
              <p className="queue-filter-label">Status</p>
              {statusOptions.map((item) => (
                <FilterOption
                  key={item.value}
                  checked={statuses.includes(item.value)}
                  label={item.label}
                  onClick={() => toggle(statuses, item.value, onStatusesChange)}
                />
              ))}
              <p className="queue-filter-label">Assignee</p>
              <FilterOption
                checked={assignees.includes(UNASSIGNED)}
                label="Unassigned"
                onClick={() => toggle(assignees, UNASSIGNED, onAssigneesChange)}
              />
              {members.map((member) => {
                const value = memberValue(member);
                return (
                  <FilterOption
                    key={member.uid || member.email}
                    checked={assignees.includes(value)}
                    label={memberLabel(member)}
                    onClick={() => toggle(assignees, value, onAssigneesChange)}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {pills.length > 0 ? (
        <ul className="queue-pills">
          {pills.map((pill) => (
            <li key={pill.key}>
              <span>{pill.label}</span>
              <button type="button" aria-label={`Remove ${pill.label}`} onClick={pill.clear}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
