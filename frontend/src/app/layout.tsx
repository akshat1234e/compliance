import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s | RBI Compliance Platform',
    default: 'RBI Compliance Platform - Enterprise Regulatory Management',
  },
  description: 'AI-powered regulatory intelligence and compliance management platform for Banks, NBFCs, and Financial Institutions',
  keywords: ['RBI', 'compliance', 'regulatory', 'banking', 'NBFC', 'financial institutions'],
  authors: [{ name: 'Compliance Platform Team' }],
  creator: 'Compliance Platform',
  publisher: 'Compliance Platform',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: 'RBI Compliance Platform',
    description: 'AI-powered regulatory intelligence and compliance management platform',
    siteName: 'RBI Compliance Platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RBI Compliance Platform',
    description: 'AI-powered regulatory intelligence and compliance management platform',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
