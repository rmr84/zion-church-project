import { StatusBadge } from '@/components/Badges';
import { CARE_TYPES, labelFor } from '@/lib/constants';
import { formatWhen } from '@/lib/format';
import { normalizeReferenceCode } from '@/lib/reference';
import { getMemberRequest } from '@/lib/requests';

export const metadata = { title: 'Check a request' };

export default async function StatusPage({ searchParams }) {
  const params = await searchParams;
  const raw = String(params.code || '');
  const code = normalizeReferenceCode(raw);
  const request = code ? getMemberRequest(code) : null;
  const missed = raw.trim() && !request;

  return (
    <section className="wrap narrow">
      <p className="eyebrow">Status</p>
      <h1>Check a request</h1>
      <p className="lede">
        Enter the reference code from your confirmation. You will see the status and any note the care team left for you.
      </p>
      <form className="stack" action="/status" method="get">
        <div className="field">
          <label htmlFor="code">Reference code</label>
          <input
            id="code"
            name="code"
            required
            maxLength={32}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            defaultValue={code || raw}
          />
        </div>
        <button className="button" type="submit">Look up</button>
      </form>
      {missed ? <p className="banner error" role="alert">No request matches that code.</p> : null}
      {request ? (
        <article className="result">
          <StatusBadge status={request.status} />
          <h2>{labelFor(CARE_TYPES, request.careType)}</h2>
          <p className="hint">Updated {formatWhen(request.updatedAt)}</p>
          <h3>Note for you</h3>
          <p className="prose">{request.memberNote.trim() || 'The care team has not added a note yet.'}</p>
        </article>
      ) : null}
    </section>
  );
}
