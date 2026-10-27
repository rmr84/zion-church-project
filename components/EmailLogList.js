'use client';

import { useState } from 'react';
import { RequestPager } from '@/components/RequestPager';

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
      <RequestPager
        page={currentPage}
        pageCount={pageCount}
        onPageChange={setPage}
        label="Email log pages"
      />
    </>
  );
}
