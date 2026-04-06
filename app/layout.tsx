import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Image from 'next/image'
import Link from 'next/link'
import './globals.css'
import { AuthBar } from '@/components/AuthBar'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'OnlyTech.boo – Learn from engineering failures',
  description:
    'Brutally honest incident library for real-world engineering failures, their root causes, and prevention steps.',
  metadataBase:
    process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
      : undefined,
  openGraph: {
    title: 'OnlyTech.boo',
    description:
      'Engineering-first, no-influencer archive of costly incidents and lessons learned.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OnlyTech.boo',
    description: 'Real incidents. Real costs. Actionable lessons.',
  },
  icons: {
    icon: [
      {
        url: '/favicon-64x64.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/favicon-64x64.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="max-w-5xl mx-auto px-4 py-2 flex flex-col gap-2">
            <div className="w-full flex justify-center">
              <Link href="/" className="inline-flex items-center">
                <Image src="/logo.png" alt="OnlyTech.boo" width={240} height={70} priority />
              </Link>
            </div>
            <div className="w-full flex justify-end">
              <AuthBar />
            </div>
          </div>
        </div>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
