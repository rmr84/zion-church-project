import Link from 'next/link';
import { RequestList } from './RequestList';

const SORTS = [
  { id: 'urgency', label: 'Urgency' },
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
];

function sortHint(sort) {
  if (sort === 'newest') return 'Newest requests first.';
  if (sort === 'oldest') return 'Oldest requests first.';
  return 'Urgent requests come first, then soon, then routine. Within a level, older requests come first.';
}

export function Queue({ title, intro, requests, sort, basePath, empty }) {
  return (
    <section className="wrap wide">
      <h1>{title}</h1>
      <p>{intro}</p>
      <nav className="sort-nav" aria-label="Sort requests">
        {SORTS.map((item) => (
          <Link
            key={item.id}
            href={`${basePath}?sort=${item.id}`}
            aria-current={sort === item.id ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <p className="hint">{sortHint(sort)}</p>
      {requests.length ? <RequestList requests={requests} /> : <p className="empty">{empty}</p>}
    </section>
  );
}
