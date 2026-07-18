import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { InstallPrompt } from '@/components/InstallPrompt';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

/**
 * The origin canonical URLs and social previews are resolved against.
 *
 * Read from the environment rather than hard-coded: Netlify injects `URL` for
 * the deployed site automatically, and `NEXT_PUBLIC_SITE_URL` overrides it for
 * a custom domain. A hard-coded host silently points every canonical tag and
 * OG image at whatever happens to own that name.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'PitchPilot — Smart Stadium Ops for FIFA World Cup 2026',
    template: '%s · PitchPilot',
  },
  description:
    'A GenAI-powered smart-stadium platform: crowd-flow intelligence, accessible wayfinding, a multilingual AI concierge and real-time operational decision support for the FIFA World Cup 2026.',
  keywords: [
    'FIFA World Cup 2026',
    'smart stadium',
    'crowd management',
    'accessibility',
    'multilingual assistant',
    'generative AI',
  ],
  authors: [{ name: 'PitchPilot' }],
  openGraph: {
    title: 'PitchPilot — Smart Stadium Ops for FIFA World Cup 2026',
    description:
      'Crowd-flow intelligence, accessible wayfinding and a multilingual AI concierge for the FIFA World Cup 2026.',
    type: 'website',
    locale: 'en_US',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#05301c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-white text-ink-900 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-pitch-700 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <ServiceWorkerRegistrar />
        <OfflineIndicator />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <InstallPrompt />
      </body>
    </html>
  );
}
