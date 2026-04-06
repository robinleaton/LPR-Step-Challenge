import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LPR Step Challenge',
  description: 'Track your steps, climb the leaderboard, and win real cash prizes with Leaton Performance.',
  themeColor: '#0047AB',
  manifest: '/manifest.json',
  openGraph: {
    title: 'LPR Step Challenge',
    description: 'Compete, evolve your avatar, and win prizes. By Leaton Performance.',
    url: 'https://leatonperformance.co.nz/step-challenge',
    siteName: 'LPR Step Challenge',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                border: '1px solid #374151',
              },
              success: { iconTheme: { primary: '#0047AB', secondary: '#fff' } },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
