import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CopyCode } from '@/components/CopyCode';
import { ArrivalToast } from '@/components/ArrivalToast';
import { normalizeReferenceCode } from '@/lib/reference';
import { isStaffSignedIn } from '@/lib/session';

export const metadata = { title: 'Request received' };

export default async function SentPage({ searchParams }) {
  if (await isStaffSignedIn()) redirect('/staff');
  const params = await searchParams;
  const code = normalizeReferenceCode(params.code);

  return (
    <section className="page-frame">
      <div className="page-heading">
        <p className="eyebrow">Received</p>
        <h1>Request Received!</h1>
      </div>
      <div className="wrap narrow">
      {code ? (
        <>
          <ArrivalToast message="Request received." />
          <p className="lede">
            Save this code. Anyone with it can see the status and the notes the team leaves for you.
            Staff notes stay with the team.
          </p>
          <div className="code-block">
            <p className="code">{code}</p>
            <CopyCode code={code} />
          </div>
          <p>
            <Link href={`/status?code=${encodeURIComponent(code)}`}>Check this request</Link>
          </p>
        </>
      ) : (
        <p>That confirmation link is missing a reference code.</p>
      )}
      </div>
    </section>
  );
}
