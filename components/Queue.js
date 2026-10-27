'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { QueueFilters } from '@/components/QueueFilters';
import { RequestTable } from '@/components/RequestTable';
import { CARE_TYPES, DESK_STATUSES, URGENCY_LEVELS, labelFor } from '@/lib/constants';
import { dayKey } from '@/lib/format';
import { UNASSIGNED, findMember, memberValue } from '@/lib/members';

const URGENCY_RANK = { urgent: 0, soon: 1, routine: 2 };
const URGENCY_VALUES = new Set(URGENCY_LEVELS.map((item) => item.value));
const CARE_VALUES = new Set(CARE_TYPES.map((item) => item.value));
const STATUS_VALUES = new Set(DESK_STATUSES.map((item) => item.value));
const FILTER_STORAGE_KEY = 'zion-desk-queue-filters';

function emptyFilters() {
  return {
    query: '',
    urgencies: [],
    careTypes: [],
    statuses: [],
    assignees: [],
    dateFrom: '',
    dateTo: '',
  };
}

function compareCreated(left, right) {
  return String(left.createdAt).localeCompare(String(right.createdAt));
}

function sortByUrgency(rows) {
  return [...rows].sort((left, right) => {
    const rank = (URGENCY_RANK[left.urgency] ?? 3) - (URGENCY_RANK[right.urgency] ?? 3);
    return rank || compareCreated(left, right);
  });
}

function matchesQuery(request, query) {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  const haystack = [
    request.referenceCode,
    request.name,
    request.description,
    request.requesterEmail,
    request.assignee,
    request.contactDetail,
    labelFor(CARE_TYPES, request.careType),
    labelFor(DESK_STATUSES, request.status),
    request.careType,
    request.status,
    request.urgency,
  ].join(' ').toLowerCase();
  return haystack.includes(term);
}

function matchesAssignee(request, assignees, members) {
  if (!assignees.length) return true;
  if (!request.assignee) return assignees.includes(UNASSIGNED);
  const member = findMember(members, request.assignee);
  const value = member ? memberValue(member) : request.assignee;
  return assignees.includes(value);
}

function matchesDate(request, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return true;
  const day = dayKey(request.createdAt);
  if (!day) return false;
  if (dateFrom && day < dateFrom) return false;
  if (dateTo && day > dateTo) return false;
  return true;
}

function parseList(value, allowed) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item && allowed.has(item));
}

function parseDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : '';
}

function normalizeFilters(raw, archive) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const statuses = (
    Array.isArray(source.statuses)
      ? source.statuses.map(String)
      : parseList(source.status, STATUS_VALUES)
  ).filter((status) => STATUS_VALUES.has(status))
    .filter((status) => (archive ? status === 'completed' : status !== 'completed'));

  return {
    query: String(source.query || source.q || ''),
    urgencies: (
      Array.isArray(source.urgencies)
        ? source.urgencies.map(String).filter((item) => URGENCY_VALUES.has(item))
        : parseList(source.urgency, URGENCY_VALUES)
    ),
    careTypes: (
      Array.isArray(source.careTypes)
        ? source.careTypes.map(String).filter((item) => CARE_VALUES.has(item))
        : parseList(source.care, CARE_VALUES)
    ),
    statuses,
    assignees: (
      Array.isArray(source.assignees)
        ? source.assignees.map(String).filter(Boolean)
        : String(source.assignee || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
    ),
    dateFrom: parseDate(source.dateFrom || source.from),
    dateTo: parseDate(source.dateTo || source.to),
  };
}

function filtersFromSearchParams(searchParams, archive) {
  return normalizeFilters({
    query: searchParams.get('q') || '',
    urgency: searchParams.get('urgency') || '',
    care: searchParams.get('care') || '',
    status: searchParams.get('status') || '',
    assignee: searchParams.get('assignee') || '',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
  }, archive);
}

function readStoredFilters(archive) {
  if (typeof window === 'undefined') return emptyFilters();
  try {
    const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return emptyFilters();
    return normalizeFilters(JSON.parse(raw), archive);
  } catch {
    return emptyFilters();
  }
}

function writeStoredFilters(filters) {
  if (typeof window === 'undefined') return;
  try {
    if (!filtersKey(filters)) {
      window.localStorage.removeItem(FILTER_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function initialFilters(searchParams, archive) {
  const fromUrl = filtersFromSearchParams(searchParams, archive);
  if (filtersKey(fromUrl)) return fromUrl;
  return readStoredFilters(archive);
}

function searchParamsFromFilters(filters) {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.urgencies.length) params.set('urgency', filters.urgencies.join(','));
  if (filters.careTypes.length) params.set('care', filters.careTypes.join(','));
  if (filters.statuses.length) params.set('status', filters.statuses.join(','));
  if (filters.assignees.length) params.set('assignee', filters.assignees.join(','));
  if (filters.dateFrom) params.set('from', filters.dateFrom);
  if (filters.dateTo) params.set('to', filters.dateTo);
  return params;
}

function filtersKey(filters) {
  return searchParamsFromFilters(filters).toString();
}

function QueueInner({
  openRequests,
  archivedRequests,
  members = [],
  initialArchive = false,
  isAdmin = false,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [archive, setArchive] = useState(initialArchive);
  const [filters, setFilters] = useState(() => initialFilters(searchParams, initialArchive));

  const {
    query,
    urgencies,
    careTypes,
    statuses,
    assignees,
    dateFrom,
    dateTo,
  } = filters;

  useEffect(() => {
    setArchive(initialArchive);
  }, [initialArchive]);

  useEffect(() => {
    const fromUrl = filtersFromSearchParams(searchParams, archive);
    if (filtersKey(fromUrl)) {
      setFilters((current) => (filtersKey(current) === filtersKey(fromUrl) ? current : fromUrl));
      return;
    }
    const stored = readStoredFilters(archive);
    setFilters((current) => (filtersKey(current) === filtersKey(stored) ? current : stored));
  }, [searchParams, archive]);

  useEffect(() => {
    writeStoredFilters(filters);
    const next = searchParamsFromFilters(filters).toString();
    const current = searchParams.toString();
    if (next === current) return;
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [filters, pathname, router, searchParams]);

  const source = archive ? archivedRequests : openRequests;
  const empty = archive ? 'No completed requests yet.' : 'No open requests.';

  const requests = useMemo(() => {
    const filtered = source.filter((request) => {
      if (!matchesQuery(request, query)) return false;
      if (urgencies.length && !urgencies.includes(request.urgency)) return false;
      if (careTypes.length && !careTypes.includes(request.careType)) return false;
      if (statuses.length && !statuses.includes(request.status)) return false;
      if (!matchesAssignee(request, assignees, members)) return false;
      if (!matchesDate(request, dateFrom, dateTo)) return false;
      return true;
    });
    return sortByUrgency(filtered);
  }, [source, query, urgencies, careTypes, statuses, assignees, dateFrom, dateTo, members]);

  function patchFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function changeArchive(next) {
    setArchive(next);
    const nextFilters = { ...filters, statuses: [] };
    setFilters(nextFilters);
    const qs = searchParamsFromFilters(nextFilters).toString();
    const href = next ? '/staff/archive' : '/staff';
    router.replace(qs ? `${href}?${qs}` : href, { scroll: false });
  }

  return (
    <section className="page-frame">
      <div className="page-heading">
        <h1>Care Requests</h1>
      </div>
      <div className="wrap wide">
        <QueueFilters
          query={query}
          onQueryChange={(value) => patchFilters({ query: value })}
          archive={archive}
          onArchiveChange={changeArchive}
          urgencies={urgencies}
          onUrgenciesChange={(value) => patchFilters({ urgencies: value })}
          careTypes={careTypes}
          onCareTypesChange={(value) => patchFilters({ careTypes: value })}
          statuses={statuses}
          onStatusesChange={(value) => patchFilters({ statuses: value })}
          assignees={assignees}
          onAssigneesChange={(value) => patchFilters({ assignees: value })}
          dateFrom={dateFrom}
          onDateFromChange={(value) => patchFilters({ dateFrom: value })}
          dateTo={dateTo}
          onDateToChange={(value) => patchFilters({ dateTo: value })}
          members={members}
        />
      </div>
      {requests.length ? (
        <RequestTable
          key={`${archive}-${filtersKey(filters)}`}
          requests={requests}
          desk
          members={members}
          allowAssign={!archive}
          allowReopen={isAdmin}
        />
      ) : (
        <p className="empty wrap wide">{empty}</p>
      )}
    </section>
  );
}

function QueueFallback({ initialArchive = false }) {
  return (
    <section className="page-frame">
      <div className="page-heading">
        <h1>Care Requests</h1>
      </div>
      <div className="wrap wide">
        <p className="hint">{initialArchive ? 'Loading archive…' : 'Loading requests…'}</p>
      </div>
    </section>
  );
}

export function Queue(props) {
  return (
    <Suspense fallback={<QueueFallback initialArchive={props.initialArchive} />}>
      <QueueInner {...props} />
    </Suspense>
  );
}
