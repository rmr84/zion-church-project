'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QueueFilters } from '@/components/QueueFilters';
import { RequestTable } from '@/components/RequestTable';
import { CARE_TYPES, DESK_STATUSES, labelFor } from '@/lib/constants';
import { UNASSIGNED, findMember, memberValue } from '@/lib/members';

const URGENCY_RANK = { urgent: 0, soon: 1, routine: 2 };

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

export function Queue({ openRequests, archivedRequests, members = [], initialArchive = false }) {
  const router = useRouter();
  const [archive, setArchive] = useState(initialArchive);
  const [query, setQuery] = useState('');
  const [urgencies, setUrgencies] = useState([]);
  const [careTypes, setCareTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [assignees, setAssignees] = useState([]);

  const source = archive ? archivedRequests : openRequests;
  const empty = archive ? 'No completed requests yet.' : 'No open requests.';

  const requests = useMemo(() => {
    const filtered = source.filter((request) => {
      if (!matchesQuery(request, query)) return false;
      if (urgencies.length && !urgencies.includes(request.urgency)) return false;
      if (careTypes.length && !careTypes.includes(request.careType)) return false;
      if (statuses.length && !statuses.includes(request.status)) return false;
      if (!matchesAssignee(request, assignees, members)) return false;
      return true;
    });
    return sortByUrgency(filtered);
  }, [source, query, urgencies, careTypes, statuses, assignees, members]);

  function changeArchive(next) {
    setArchive(next);
    setStatuses([]);
    router.replace(next ? '/staff/archive' : '/staff', { scroll: false });
  }

  return (
    <section className="page-frame">
      <div className="page-heading">
        <h1>Care Requests</h1>
      </div>
      <div className="wrap wide">
        <QueueFilters
          query={query}
          onQueryChange={setQuery}
          archive={archive}
          onArchiveChange={changeArchive}
          urgencies={urgencies}
          onUrgenciesChange={setUrgencies}
          careTypes={careTypes}
          onCareTypesChange={setCareTypes}
          statuses={statuses}
          onStatusesChange={setStatuses}
          assignees={assignees}
          onAssigneesChange={setAssignees}
          members={members}
        />
      </div>
      {requests.length ? (
        <RequestTable
          key={`${archive}-${query}-${urgencies.join(',')}-${careTypes.join(',')}-${statuses.join(',')}-${assignees.join(',')}`}
          requests={requests}
          desk
          members={members}
        />
      ) : (
        <p className="empty wrap wide">{empty}</p>
      )}
    </section>
  );
}
