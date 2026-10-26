import { redirect } from 'next/navigation';
import { CARE_TYPES, CONTACT_METHODS, STATUSES, URGENCY_LEVELS, labelFor } from '@/lib/constants';
import { formatWhen } from '@/lib/format';
import { normalizeReferenceCode } from '@/lib/reference';
import { getMemberRequest } from '@/lib/requests';
import { isStaffSignedIn } from '@/lib/session';

export const metadata = { title: 'Check a Request' };

export default async function StatusPage({ searchParams }) {
  if (await isStaffSignedIn()) redirect('/staff');
  const params = await searchParams;
  const raw = String(params.code || '');
  const code = normalizeReferenceCode(raw);
  const request = code ? await getMemberRequest(code) : null;
  const missed = raw.trim() && !request;

  return (
    <section className="page-frame status-page">
      <div className="page-heading centered-web">
        <p className="eyebrow">Status</p>
        <h1>Check a Request</h1>
        <p className="lede">
          Enter the reference code from your confirmation. You will see the status and any note the care team left for you.
        </p>
      </div>
      <div className={request ? 'status-layout has-result' : 'status-layout'}>
        <div className="status-lookup">
          <form className="stack" action="/status" method="get">
            <div className="field">
              <label htmlFor="code">Reference Code</label>
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
            <button className="button" type="submit">Look Up</button>
          </form>
          {missed ? <p className="banner error" role="alert">No request matches that code.</p> : null}
        </div>
        {request ? (
          <article className="status-result">
            <p className="hint status-updated">Updated {formatWhen(request.updatedAt)}</p>
            <dl className="request-summary status-summary">
              <div>
                <dt>Name</dt>
                <dd>{request.name || 'Name not given'}</dd>
              </div>
              <div>
                <dt>Type Of Care</dt>
                <dd>{labelFor(CARE_TYPES, request.careType)}</dd>
              </div>
              <div>
                <dt>What Is Your Request?</dt>
                <dd>{request.description}</dd>
              </div>
              <div>
                <dt>Preferred Contact Method</dt>
                <dd>{labelFor(CONTACT_METHODS, request.contactMethod)}</dd>
              </div>
              {request.contactMethod === 'in_person' || request.contactMethod === 'none' || !request.contactDetail ? null : (
                <div>
                  <dt>How Should We Reach You?</dt>
                  <dd>{request.contactDetail}</dd>
                </div>
              )}
              <div>
                <dt>Urgency</dt>
                <dd>{labelFor(URGENCY_LEVELS, request.urgency)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{labelFor(STATUSES, request.status)}</dd>
              </div>
              <div>
                <dt>Note For You</dt>
                <dd>{String(request.memberNote || '').trim() || 'The care team has not added a note yet.'}</dd>
              </div>
            </dl>
          </article>
        ) : null}
      </div>
    </section>
  );
}
