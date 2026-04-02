import type { Metadata } from 'next'
import { buildSeoMetadata } from '../lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Contact Us — FL4SH',
  description:
    'Contact FL4SH and 4Sight Education: questions, partnerships, or feedback. Reach us via the form or email.',
  path: '/contact',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
