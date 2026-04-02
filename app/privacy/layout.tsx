import type { Metadata } from 'next'
import { buildSeoMetadata } from '../lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Privacy Policy — FL4SH',
  description:
    'How FL4SH and 4Sight Education collect, use, and protect your personal information when you use the app and website.',
  path: '/privacy',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
