import Link from 'next/link';
import { redirect } from 'next/navigation';
import { StatusBadge, UrgencyBadge } from '@/components/Badges';
import { CARE_TYPES, labelFor } from '@/lib/constants';
import { formatDay } from '@/lib/format';
import { listRequesterRequests } from '@/lib/requests';
import { getRequester } from '@/lib/session';

export const metadata = { title: 'My requests' };

export default async function AccountPage() {
  const requester = await getRequester();
  if (!requester) redirect('/sign-in');

  const requests = await listRequesterRequests(requester.uid);

  const empty = requests.length === 0;

  return (
    <section className={empty ? 'page-frame account-blank' : 'page-frame'}>
      <div className="page-heading">
        <p className="eyebrow">Care requester</p>
        <h1>My Requests</h1>
      </div>
      {empty ? (
        <div className="account-empty-block">
          <p className="hint">No requests are saved to this account yet.</p>
          <Link className="button" href="/request">Request Care</Link>
        </div>
      ) : (
        <div className="request-table-wrap">
          <table className="request-table">
            <thead>
              <tr>
                <th scope="col">Type of Care</th>
                <th scope="col" className="request-description">Description</th>
                <th scope="col">Urgency</th>
                <th scope="col">Reference Code</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.referenceCode}>
                  <td>
                    <Link href={`/status?code=${encodeURIComponent(request.referenceCode)}`}>
                      {labelFor(CARE_TYPES, request.careType)}
                    </Link>
                  </td>
                  <td className="request-description"><span>{request.description}</span></td>
                  <td>{request.urgency ? <UrgencyBadge urgency={request.urgency} /> : null}</td>
                  <td>{request.referenceCode}</td>
                  <td><StatusBadge status={request.status} /></td>
                  <td><time dateTime={request.createdAt}>{formatDay(request.createdAt)}</time></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
