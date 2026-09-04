import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { I18nProvider } from '@/lib/i18n';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aime Christian Documentaries | Ibyegeranyo.com',
  description: 'Premium access to advertisement-free Rwandan stories and investigations. Watch Aime Christian documentaries ad-free.',
  keywords: ['documentaries', 'Rwanda', 'Aime Christian', 'Ibyegeranyo', 'African stories', 'investigations'],
  authors: [{ name: 'Aime Christian' }],
  openGraph: {
    title: 'Aime Christian Documentaries | Ibyegeranyo.com',
    description: 'Premium access to advertisement-free Rwandan stories and investigations.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Ibyegeranyo.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aime Christian Documentaries | Ibyegeranyo.com',
    description: 'Premium access to advertisement-free Rwandan stories and investigations.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen flex flex-col">
        <I18nProvider>
          <Navbar />
          <main className="flex-1 page-shell">
            {children}
          </main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
