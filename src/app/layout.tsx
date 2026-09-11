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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://ibyegeranyo.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Aime Christian Documentaries | Ibyegeranyo.com',
    template: '%s | Ibyegeranyo.com',
  },
  description:
    'Premium ad-free Rwandan documentaries and investigations by Aime Christian. Watch exclusive stories on Ibyegeranyo.com.',
  keywords: [
    'documentaries',
    'Rwanda',
    'Aime Christian',
    'Ibyegeranyo',
    'African stories',
    'investigations',
    'Rwandan documentaries',
    'ad-free documentaries',
  ],
  authors: [{ name: 'Aime Christian' }],
  creator: 'Aime Christian',
  publisher: 'Ibyegeranyo.com',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Aime Christian Documentaries | Ibyegeranyo.com',
    description:
      'Premium ad-free Rwandan documentaries and investigations by Aime Christian.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Ibyegeranyo.com',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aime Christian Documentaries | Ibyegeranyo.com',
    description:
      'Premium ad-free Rwandan documentaries and investigations by Aime Christian.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'entertainment',
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
          <main className="flex-1 page-shell">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
