import Link from 'next/link';
import { RequestTable } from './RequestTable';

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
    <section className="page-frame">
      <div className="page-heading">
        <p className="eyebrow">Care Team</p>
        <h1>{title}</h1>
        <p className="lede">{intro}</p>
      </div>
      <div className="wrap wide">
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
      </div>
      {requests.length ? <RequestTable requests={requests} desk /> : <p className="empty wrap wide">{empty}</p>}
    </section>
  );
}
