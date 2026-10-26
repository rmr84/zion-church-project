'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { CARE_TYPES, DESK_STATUSES, URGENCY_LEVELS } from '@/lib/constants';
import { formatDateInput } from '@/lib/format';
import { UNASSIGNED, activeMembers, memberLabel, memberValue } from '@/lib/members';

function dateRangeLabel(dateFrom, dateTo) {
  if (dateFrom && dateTo) {
    return `${formatDateInput(dateFrom)} – ${formatDateInput(dateTo)}`;
  }
  if (dateFrom) return `From ${formatDateInput(dateFrom)}`;
  if (dateTo) return `Through ${formatDateInput(dateTo)}`;
  return '';
}

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
  dateFrom = '',
  onDateFromChange,
  dateTo = '',
  onDateToChange,
  members = [],
}) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const rootRef = useRef(null);
  const dialogRef = useRef(null);
  const titleId = useId();
  const statusOptions = DESK_STATUSES.filter((item) => (
    archive ? item.value === 'completed' : item.value !== 'completed'
  ));

  useEffect(() => {
    const media = window.matchMedia('(max-width: 759px)');
    function apply() {
      setPhone(media.matches);
    }
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!open || phone) return undefined;
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
  }, [open, phone]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && phone && !dialog.open) dialog.showModal();
    if ((!open || !phone) && dialog.open) dialog.close();
  }, [open, phone]);

  function toggle(list, value, onChange) {
    onChange(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function clearFilters() {
    onUrgenciesChange([]);
    onCareTypesChange([]);
    onStatusesChange([]);
    onAssigneesChange([]);
    onDateFromChange('');
    onDateToChange('');
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

  const rangeLabel = dateRangeLabel(dateFrom, dateTo);
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
    ...(rangeLabel ? [{
      key: 'date-range',
      label: rangeLabel,
      clear: () => {
        onDateFromChange('');
        onDateToChange('');
      },
    }] : []),
  ];

  const filterBody = (
    <>
      <p className="queue-filter-label">Date submitted</p>
      <div className="queue-filter-dates">
        <label>
          <span>From</span>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(event) => onDateFromChange(event.target.value)}
          />
        </label>
        <label>
          <span>To</span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => onDateToChange(event.target.value)}
          />
        </label>
      </div>
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
      {activeMembers(members).map((member) => {
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
      {pills.length > 0 ? (
        <button className="queue-filter-clear" type="button" onClick={clearFilters}>
          Clear filters
        </button>
      ) : null}
    </>
  );

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
            aria-haspopup={phone ? 'dialog' : 'menu'}
            onClick={() => setOpen((current) => !current)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16M7 12h10M10 18h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Filter
          </button>
          {open && !phone ? (
            <div className="queue-filter-menu" role="menu">
              {filterBody}
            </div>
          ) : null}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="sign-out-dialog queue-filter-dialog"
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className="sign-out-head">
          <span className="sign-out-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M4 6h16M7 12h10M10 18h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <button className="sign-out-close" type="button" aria-label="Close filters" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <h2 id={titleId}>Filter</h2>
        <p>Narrow the care request list by date, urgency, type, status, or assignee.</p>
        <div className="queue-filter-dialog-body">
          {filterBody}
        </div>
        <div className="modal-actions">
          {pills.length > 0 ? (
            <button className="button secondary" type="button" onClick={clearFilters}>
              Clear
            </button>
          ) : (
            <button className="button secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          )}
          <button className="button" type="button" onClick={() => setOpen(false)}>
            Done
          </button>
        </div>
      </dialog>

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
