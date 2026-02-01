import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FL4SH Flashcards | GCSE & A-Level Revision App | AI-Powered Study',
  description: 'Download FL4SH: AI-powered flashcard app for GCSE & A-Level revision. 10,000+ topics for all UK exam boards (AQA, Edexcel, OCR, WJEC, SQA). Free to download, Pro free for 30 days.',
  keywords: 'flashcards app, GCSE flashcards, A-Level flashcards, revision app, flash cards, GCSE revision, A-Level revision, AQA flashcards, Edexcel flashcards, OCR flashcards, WJEC flashcards, spaced repetition, Leitner system, UK exam boards, AI study tools, exam revision, study app, digital flashcards, mobile flashcards',
  authors: [{ name: '4Sight Education Ltd' }],
  creator: '4Sight Education Ltd',
  publisher: '4Sight Education Ltd',
  alternates: {
    canonical: 'https://www.fl4shcards.com',
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
    title: 'FL4SH - AI-Powered Flashcard App for GCSE & A-Level',
    description: 'Download FL4SH now on iOS and Android. AI-powered flashcards, 10,000+ exam topics, past papers included. Get Pro free for 30 days.',
    url: 'https://www.fl4shcards.com',
    siteName: 'FL4SH',
    images: [
      {
        url: 'https://fl4shcards.com/flash_assets/banner-1500x500.png',
        width: 1500,
        height: 500,
        alt: 'FL4SH - AI-Powered Flashcards for GCSE & A-Level',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FL4SH - AI Flashcard App for GCSE & A-Level',
    description: 'Download FL4SH now on iOS and Android. Get Pro free for 30 days. AI-powered revision for all UK exam boards.',
    images: ['https://www.fl4shcards.com/flash_assets/banner-1500x500.png'],
  },
  verification: {
    // Set in Vercel env as GOOGLE_SITE_VERIFICATION to avoid hardcoding.
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Root favicon for crawlers (Google/Bing often request /favicon.ico) */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        {/* Use real PNG favicons (some .ico files in repo are PNG-in-disguise) */}
        <link rel="icon" type="image/png" sizes="16x16" href="/flash_assets/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/flash_assets/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/flash_assets/favicon-48.png" />
        <link rel="shortcut icon" type="image/png" href="/flash_assets/favicon-32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/flash_assets/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A0A1F" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}

