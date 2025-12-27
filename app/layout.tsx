import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/hooks/useAuth'
import './globals.css'

export const metadata: Metadata = {
  title: 'FocusStudy - Study Timer & Exam Prep',
  description: 'All-in-one study companion: Pomodoro timer with analytics and exam accountability system with daily check-ins, verdicts, and peer comparison.',
  manifest: '/manifest.json',
  keywords: ['study timer', 'pomodoro', 'exam prep', 'accountability', 'focus', 'productivity'],
  authors: [{ name: 'FocusStudy' }],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FocusStudy',
  },
  openGraph: {
    title: 'FocusStudy - Study Timer & Exam Prep',
    description: 'Study smarter with integrated timer and exam accountability',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3B82F6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased pb-safe">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
