import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import Link from 'next/link';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'BiasMap',
  description: 'Know your seat before the lights go down. Concert intel for BTS ARIRANG World Tour.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: 'var(--bg)',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div
            style={{
              maxWidth: 640,
              margin: '0 auto',
              padding: '0 16px',
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: '-0.02em',
                color: 'var(--text)',
                textDecoration: 'none',
              }}
            >
              BiasMap
            </Link>
            <Link
              href="/about"
              style={{
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: 13,
                color: 'var(--text-dim)',
                textDecoration: 'none',
              }}
            >
              About
            </Link>
          </div>
        </header>

        <main style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>
          {children}
        </main>

        <Analytics />
      </body>
    </html>
  );
}
