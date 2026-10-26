'use client';

import { useState } from 'react';

const PAGE_SIZE = 5;

export function EmailLogList({ entries = [] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = entries.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  if (entries.length === 0) {
    return (
      <p className="empty">Nothing has been logged yet. Save a status change to write the first one.</p>
    );
  }

  return (
    <>
      {visible.map((entry, index) => (
        <pre key={`${currentPage}-${index}-${entry.slice(0, 40)}`} className="log">{entry}</pre>
      ))}
      {pageCount > 1 ? (
        <nav className="request-pager" aria-label="Email log pages">
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
          <button
            type="button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === pageCount - 1}
          >
            Next
          </button>
        </nav>
      ) : null}
    </>
  );
}
