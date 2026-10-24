import { RequestForm } from '@/components/RequestForm';

export const metadata = { title: 'Request care' };

export default function RequestPage() {
  return (
    <section className="wrap narrow">
      <p className="eyebrow">New request</p>
      <h1>Request care</h1>
      <p className="lede">Share only what the team needs. Your name is optional.</p>
      <RequestForm />
    </section>
  );
}
