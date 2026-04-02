import type { Metadata } from 'next'
import { buildSeoMetadata } from '../lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Beta Tester Feedback — FL4SH',
  description:
    'Share feedback on the FL4SH beta: help us improve the AI flashcard app for GCSE and A-Level revision.',
  path: '/tester-feedback',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
