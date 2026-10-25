import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RequestTable } from '@/components/RequestTable';
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
        <RequestTable requests={requests} />
      )}
    </section>
  );
}
