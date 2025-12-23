import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/hooks/useAuth'
import './globals.css'

export const metadata: Metadata = {
  title: 'FocusStudy - Calm Study Timer & Focus Tracker',
  description: 'A calm, supportive study timer with guilt-free tracking and focus analytics',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FocusStudy',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4F7CAC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
