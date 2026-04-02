import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import SiteCreditFooter from './components/SiteCreditFooter'
import { FL4SH_OG_IMAGE_PATH, SITE_URL } from './lib/seo'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const ogImageAbsolute = `${SITE_URL}${FL4SH_OG_IMAGE_PATH}`

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'FL4SH Flashcards | GCSE & A-Level Revision App | AI-Powered Study',
  description:
    'Download FL4SH: AI-powered flashcard app for GCSE & A-Level revision. 10,000+ topics for all UK exam boards (AQA, Edexcel, OCR, WJEC, SQA). Free to download, Pro free for 10 days.',
  keywords:
    'flashcards app, GCSE flashcards, A-Level flashcards, revision app, flash cards, GCSE revision, A-Level revision, AQA flashcards, Edexcel flashcards, OCR flashcards, WJEC flashcards, spaced repetition, Leitner system, UK exam boards, AI study tools, exam revision, study app, digital flashcards, mobile flashcards',
  authors: [{ name: '4Sight Education Ltd' }],
  creator: '4Sight Education Ltd',
  publisher: '4Sight Education Ltd',
  alternates: {
    canonical: `${SITE_URL}/`,
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
  openGraph: {
    title: 'FL4SH — AI-Powered Flashcard App for GCSE & A-Level',
    description:
      'Download FL4SH now on iOS and Android. AI-powered flashcards, 10,000+ exam topics, past papers included. Get Pro free for 10 days.',
    url: `${SITE_URL}/`,
    siteName: 'FL4SH',
    images: [
      {
        url: FL4SH_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: 'FL4SH — AI-powered flashcards for GCSE & A-Level',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FL4SH — AI Flashcard App for GCSE & A-Level',
    description:
      'Download FL4SH now on iOS and Android. Get Pro free for 10 days. AI-powered revision for all UK exam boards.',
    images: [ogImageAbsolute],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB">
      <head>
        <meta charSet="utf-8" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-D74SL0V284"
          strategy="afterInteractive"
        />
        <Script id="ga4-fl4sh" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-D74SL0V284');
          `}
        </Script>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/flash_assets/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/flash_assets/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/flash_assets/favicon-48.png" />
        <link rel="shortcut icon" type="image/png" href="/flash_assets/favicon-32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/flash_assets/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A0A1F" />
      </head>
      <body className={inter.className}>
        {children}
        <SiteCreditFooter />
      </body>
    </html>
  )
}
