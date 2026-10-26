'use client';

import { useEffect, useState } from 'react';
import { RoleBadge } from '@/components/Badges';
import { MemberAvatar } from '@/components/MemberAvatar';

const WEB_PAGE_SIZE = 5;
const PHONE_PAGE_SIZE = 3;

export function UserTable({ members = [] }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(WEB_PAGE_SIZE);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 759px)');
    function apply() {
      const nextSize = media.matches ? PHONE_PAGE_SIZE : WEB_PAGE_SIZE;
      setPageSize(nextSize);
      setPage((value) => Math.min(value, Math.max(0, Math.ceil(members.length / nextSize) - 1)));
    }
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [members.length]);

  if (members.length === 0) {
    return <p className="hint request-table-wrap">No care team members are on file yet.</p>;
  }

  const pageCount = Math.max(1, Math.ceil(members.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = members.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  return (
    <div className="request-table-wrap">
      <table className="request-table member-table">
        <thead>
          <tr>
            <th scope="col" className="user-name">Name</th>
            <th scope="col" className="user-email">Email</th>
            <th scope="col" className="user-role">Role</th>
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
              <td className="user-email">
                <span className="cell-label">Email</span>
                {member.email}
              </td>
              <td className="user-role">
                <span className="cell-label">Role</span>
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
    </div>
  );
}
