import type { Metadata } from 'next'
import { buildSeoMetadata } from '../lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Redeem FL4SH Pro — FL4SH',
  description:
    'Redeem your FL4SH Pro access code in the app. Open FL4SH, sign in, and enter your code.',
  path: '/claim',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
