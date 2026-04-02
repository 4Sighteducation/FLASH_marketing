import type { Metadata } from 'next'
import { buildSeoMetadata } from '../lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Support — FL4SH',
  description:
    'Get help with FL4SH: contact support, FAQs, account and subscription questions. We usually reply within 24 hours.',
  path: '/support',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
