import Link from 'next/link';
import { CopyCode } from '@/components/CopyCode';
import { normalizeReferenceCode } from '@/lib/reference';

export const metadata = { title: 'Request received' };

export default async function SentPage({ searchParams }) {
  const params = await searchParams;
  const code = normalizeReferenceCode(params.code);

  return (
    <section className="wrap narrow">
      <p className="eyebrow">Received</p>
      <h1>We have your request.</h1>
      {code ? (
        <>
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
    </section>
  );
}
