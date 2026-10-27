'use client';

import { useEffect, useState } from 'react';

function pageItems(pageCount, currentPage, compact) {
  if (!compact || pageCount <= 3) {
    return Array.from({ length: pageCount }, (_, index) => index);
  }

  const last = pageCount - 1;
  if (currentPage <= 1) {
    return [0, 1, 'ellipsis', last];
  }
  if (currentPage >= last - 1) {
    return [0, 'ellipsis', last - 1, last];
  }
  return [0, 'ellipsis', currentPage, 'ellipsis', last];
}

export function RequestPager({
  page,
  pageCount,
  onPageChange,
  label = 'Pages',
}) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 759px)');
    function apply() {
      setCompact(media.matches);
    }
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  if (pageCount <= 1) return null;

  const currentPage = Math.min(Math.max(0, page), pageCount - 1);
  const items = pageItems(pageCount, currentPage, compact);

  return (
    <nav className="request-pager" aria-label={label}>
      <button
        className="request-pager-step"
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        Previous
      </button>
      <div className="request-pager-pages">
        {items.map((item, index) => (
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="request-pager-ellipsis" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === currentPage ? 'page' : undefined}
              onClick={() => onPageChange(item)}
            >
              {item + 1}
            </button>
          )
        ))}
      </div>
      <button
        className="request-pager-step"
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === pageCount - 1}
      >
        Next
      </button>
    </nav>
  );
}
