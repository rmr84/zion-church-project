import './globals.css';
import { FirebaseApp } from '@/components/FirebaseApp';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: {
    default: 'Care desk · Zion Church',
    template: '%s · Zion Church',
  },
  description: 'A private way for Zion Church members to ask the pastoral care team for help.',
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <FirebaseApp />
        <Header />
        <main id="main" tabIndex={-1}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
