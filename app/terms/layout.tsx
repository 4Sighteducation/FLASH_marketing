import type { Metadata } from 'next'
import { buildSeoMetadata } from '../lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Terms of Service — FL4SH',
  description:
    'Terms of Service for FL4SH: AI-powered flashcards for GCSE and A-Level. Subscriptions, acceptable use, and your rights.',
  path: '/terms',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
