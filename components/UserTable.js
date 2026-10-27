'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deletePendingUser } from '@/app/actions/users';
import { RoleBadge } from '@/components/Badges';
import { InviteUser } from '@/components/InviteUser';
import { MemberAvatar } from '@/components/MemberAvatar';
import { RequestPager } from '@/components/RequestPager';
import { useToast } from '@/components/Toast';

const PAGE_SIZE = 5;

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path
        d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2 0v11.2a1.8 1.8 0 0 1-1.8 1.8H8.8A1.8 1.8 0 0 1 7 18.2V7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v5M14 11v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatusPill({ status }) {
  if (status === 'pending') {
    return (
      <span className="badge badge-soft badge-soon">
        <span className="badge-dot" aria-hidden="true" />
        Pending
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
  const router = useRouter();
  const showToast = useToast();
  const searchId = useId();
  const titleId = useId();
  const dialogRef = useRef(null);
  const [tab, setTab] = useState('active');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [confirmMember, setConfirmMember] = useState(null);
  const [busy, setBusy] = useState(false);

  const activeCount = useMemo(
    () => members.filter((member) => member.status !== 'pending').length,
    [members],
  );
  const pendingCount = useMemo(
    () => members.filter((member) => member.status === 'pending').length,
    [members],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return members.filter((member) => {
      const status = member.status === 'pending' ? 'pending' : 'active';
      if (status !== tab) return false;
      if (!term) return true;
      const haystack = [member.name, member.email, member.role, status].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [members, query, tab]);

  useEffect(() => {
    setPage(0);
  }, [query, tab]);

  useEffect(() => {
    setPage((value) => Math.min(value, Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1)));
  }, [filtered.length]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirmMember && !dialog.open) dialog.showModal();
    if (!confirmMember && dialog.open) dialog.close();
  }, [confirmMember]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  const tabCount = tab === 'pending' ? pendingCount : activeCount;
  const userCountLabel = tabCount === 1 ? '1 User' : `${tabCount} Users`;
  const showActions = canInvite;

  function closeConfirm() {
    if (busy) return;
    setConfirmMember(null);
  }

  async function confirmDelete() {
    if (!confirmMember || busy) return;
    setBusy(true);
    const result = await deletePendingUser({
      uid: confirmMember.uid,
      email: confirmMember.email,
    });
    setBusy(false);
    if (!result?.ok) {
      showToast?.(result?.formError || 'That user could not be deleted.');
      return;
    }
    setConfirmMember(null);
    showToast?.(result.warning || 'Pending user deleted.');
    router.refresh();
  }

  return (
    <div className="users-panel request-table-wrap">
      <div className="users-panel-head">
        <div className="users-panel-title">
          <h2>Team members</h2>
          <span className="users-count">{userCountLabel}</span>
        </div>
        <div className="users-panel-tools">
          <div className="queue-switch users-status-tabs" role="group" aria-label="User status">
            <button type="button" aria-pressed={tab === 'active'} onClick={() => setTab('active')}>
              Active
            </button>
            <button type="button" aria-pressed={tab === 'pending'} onClick={() => setTab('pending')}>
              Pending
            </button>
          </div>
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
        <p className="empty">
          {query.trim()
            ? 'No team members match that search.'
            : tab === 'pending'
              ? 'No pending invites.'
              : 'No active team members.'}
        </p>
      ) : (
        <>
          <table className="request-table member-table">
            <thead>
              <tr>
                <th scope="col" className="user-name">Name</th>
                <th scope="col" className="user-status">Status</th>
                <th scope="col" className="user-email">Email address</th>
                <th scope="col" className="user-role">User Role</th>
                {showActions ? (
                  <th scope="col" className="user-actions">
                    <span className="sr-only">Actions</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {visible.map((member) => {
                const pending = member.status === 'pending';
                return (
                  <tr key={member.uid || member.email}>
                    <td className="user-name">
                      <span className="cell-label">Name</span>
                      <span className="user-name-mark" title={member.name || member.email}>
                        <MemberAvatar member={member} />
                        <span>{member.name || '—'}</span>
                      </span>
                    </td>
                    <td className="user-status">
                      <span className="cell-label">Status</span>
                      <StatusPill status={pending ? 'pending' : 'active'} />
                    </td>
                    <td className="user-email">
                      <span className="cell-label">Email address</span>
                      {member.email}
                    </td>
                    <td className="user-role">
                      <span className="cell-label">User Role</span>
                      <RoleBadge role={member.role} />
                    </td>
                    {showActions ? (
                      <td className={`user-actions${pending ? '' : ' is-empty'}`}>
                        {pending ? (
                          <>
                            <span className="cell-label">Actions</span>
                            <button
                              className="user-delete"
                              type="button"
                              aria-label={`Delete ${member.name || member.email}`}
                              disabled={busy}
                              onClick={() => setConfirmMember(member)}
                            >
                              <TrashIcon />
                              <span className="user-delete-label">Delete user</span>
                            </button>
                          </>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <RequestPager
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
            label="User pages"
          />
        </>
      )}

      {showActions ? (
        <dialog
          ref={dialogRef}
          className="sign-out-dialog user-delete-dialog"
          aria-labelledby={titleId}
          onClose={closeConfirm}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeConfirm();
          }}
        >
          {confirmMember ? (
            <>
              <div className="sign-out-head">
                <span className="sign-out-icon user-delete-icon" aria-hidden="true">
                  <TrashIcon />
                </span>
                <button className="sign-out-close" type="button" aria-label="Close" onClick={closeConfirm}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <h2 id={titleId}>Delete User</h2>
              <p>
                Are you sure you want to delete
                {' '}
                <strong>{confirmMember.name || confirmMember.email}</strong>
                ? This pending invite will be removed.
              </p>
              <div className="modal-actions">
                <button className="button secondary" type="button" disabled={busy} onClick={closeConfirm}>
                  Cancel
                </button>
                <button className="button user-delete-confirm" type="button" disabled={busy} onClick={confirmDelete}>
                  {busy ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </>
          ) : null}
        </dialog>
      ) : null}
    </div>
  );
}
