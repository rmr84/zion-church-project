'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { RoleBadge } from '@/components/Badges';
import { InviteUser } from '@/components/InviteUser';
import { MemberAvatar } from '@/components/MemberAvatar';

const PAGE_SIZE = 5;

function memberStatus(member) {
  return String(member?.uid || '').startsWith('invite') ? 'invited' : 'active';
}

function StatusPill({ status }) {
  if (status === 'invited') {
    return (
      <span className="badge badge-soft badge-soon">
        <span className="badge-dot" aria-hidden="true" />
        Invited
      </span>
    );
  }
  return (
    <span className="badge badge-soft users-status-active">
      <span className="badge-dot" aria-hidden="true" />
      Active
    </span>
  );
}

export function UserTable({ members = [], canInvite = false }) {
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) => {
      const haystack = [member.name, member.email, member.role, memberStatus(member)]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [members, query]);

  useEffect(() => {
    setPage(0);
  }, [query]);

  useEffect(() => {
    setPage((value) => Math.min(value, Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1)));
  }, [filtered.length]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  const userCountLabel = members.length === 1 ? '1 User' : `${members.length} Users`;

  return (
    <div className="users-panel request-table-wrap">
      <div className="users-panel-head">
        <div className="users-panel-title">
          <h2>Team members</h2>
          <span className="users-count">{userCountLabel}</span>
        </div>
        <div className="users-panel-tools">
          <label className="queue-search users-search" htmlFor={searchId}>
            <span className="sr-only">Search team members</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M15.5 15.5 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              id={searchId}
              type="search"
              placeholder="Search team members"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <InviteUser canInvite={canInvite} />
        </div>
      </div>

      {members.length === 0 ? (
        <p className="empty">No care team members are on file yet.</p>
      ) : filtered.length === 0 ? (
        <p className="empty">No team members match that search.</p>
      ) : (
        <>
          <table className="request-table member-table">
            <thead>
              <tr>
                <th scope="col" className="user-name">Name</th>
                <th scope="col" className="user-status">Status</th>
                <th scope="col" className="user-email">Email address</th>
                <th scope="col" className="user-role">User Role</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((member) => (
                <tr key={member.uid || member.email}>
                  <td className="user-name">
                    <span className="cell-label">Name</span>
                    <span className="user-name-mark" title={member.name}>
                      <MemberAvatar member={member} />
                      <span>{member.name}</span>
                    </span>
                  </td>
                  <td className="user-status">
                    <span className="cell-label">Status</span>
                    <StatusPill status={memberStatus(member)} />
                  </td>
                  <td className="user-email">
                    <span className="cell-label">Email address</span>
                    {member.email}
                  </td>
                  <td className="user-role">
                    <span className="cell-label">User Role</span>
                    <RoleBadge role={member.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pageCount > 1 ? (
            <nav className="request-pager" aria-label="User pages">
              <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0}>
                Previous
              </button>
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-current={index === currentPage ? 'page' : undefined}
                  onClick={() => setPage(index)}
                >
                  {index + 1}
                </button>
              ))}
              <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount - 1}>
                Next
              </button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
