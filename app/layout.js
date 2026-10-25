import './globals.css';
import { FirebaseApp } from '@/components/FirebaseApp';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { ToastProvider } from '@/components/Toast';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: {
    default: 'Care desk · Zion Church',
    template: '%s · Zion Church',
  },
  description: 'Ask the Zion Church care team for a visit, a meal, counseling, or prayer.',
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <a className="skip" href="#main">Skip to content</a>
          <FirebaseApp />
          <Header />
          <main id="main" tabIndex={-1}>{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
