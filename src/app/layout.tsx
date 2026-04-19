import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import VisitorTracker from '@/components/VisitorTracker'

export const metadata: Metadata = {
  title: 'Thursday Football League',
  description: 'Track stats, standings, and more',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'Thursday Football League',
    description: 'Track stats, standings, and more',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0f172a] text-white antialiased min-h-screen">
        <Providers>
          <VisitorTracker />
          {children}
        </Providers>
      </body>
    </html>
  )
}