import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'LABORO - Global Work Platform',
    template: '%s | LABORO',
  },
  description: 'Enterprise-grade global work platform for managing distributed teams, jobs, and talent across time zones.',
  keywords: ['work platform', 'remote work', 'global talent', 'enterprise', 'job management'],
  authors: [{ name: 'LABORO' }],
  creator: 'LABORO',
  metadataBase: new URL('https://laboro.io'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://laboro.io',
    siteName: 'LABORO',
    title: 'LABORO - Global Work Platform',
    description: 'Enterprise-grade global work platform for managing distributed teams across time zones.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LABORO - Global Work Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LABORO - Global Work Platform',
    description: 'Enterprise-grade global work platform for managing distributed teams across time zones.',
    images: ['/og-image.png'],
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
