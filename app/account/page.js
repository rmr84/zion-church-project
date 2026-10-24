import Link from 'next/link';
import { redirect } from 'next/navigation';
import { StatusBadge } from '@/components/Badges';
import { CARE_TYPES, labelFor } from '@/lib/constants';
import { formatDay } from '@/lib/format';
import { listRequesterRequests } from '@/lib/requests';
import { getRequester } from '@/lib/session';

export const metadata = { title: 'My requests' };

export default async function AccountPage() {
  const requester = await getRequester();
  if (!requester) redirect('/sign-in');

  const requests = await listRequesterRequests(requester.uid);

  return (
    <section className="wrap narrow">
      <p className="eyebrow">Care requester</p>
      <h1>My requests</h1>
      <p className="lede">
        Signed in as {requester.email}. This list is only the requests you sent while signed in.
        A request sent without an account stays with its reference code.
      </p>
      {requests.length === 0 ? (
        <p className="hint">No requests are saved to this account yet.</p>
      ) : (
        <ol className="request-list">
          {requests.map((request) => (
            <li key={request.referenceCode}>
              <Link className="request-row account" href={`/status?code=${encodeURIComponent(request.referenceCode)}`}>
                <span className="row-main">
                  <span className="row-title">{labelFor(CARE_TYPES, request.careType)}</span>
                  <span className="row-sub">{request.referenceCode}</span>
                </span>
                <StatusBadge status={request.status} />
                <time dateTime={request.createdAt}>{formatDay(request.createdAt)}</time>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <p>
        <Link className="button" href="/request">Request care</Link>
      </p>
    </section>
  );
}
