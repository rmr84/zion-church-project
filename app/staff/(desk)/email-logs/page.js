import { EmailLogList } from '@/components/EmailLogList';
import { listEmailLogEntries } from '@/lib/notify';

export const metadata = { title: 'Email Logs' };

export default async function EmailLogsPage() {
  const entries = await listEmailLogEntries();

  return (
    <section className="page-frame">
      <div className="page-heading">
        <h1>Email Logs</h1>
        <p className="lede">
          Outbound messages that would go to requesters and invitees. When a request is received,
          its status changes, or a desk invite is sent, the email we would send is written here and
          printed in the server console.
        </p>
      </div>
      <div className="wrap wide">
        <EmailLogList entries={entries} />
      </div>
    </section>
  );
}
