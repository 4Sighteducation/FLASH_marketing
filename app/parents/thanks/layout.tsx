import type { Metadata } from 'next'
import { buildSeoMetadata } from '../../lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Thanks — Your FL4SH Pro Purchase — FL4SH',
  description:
    'Thank you. We’ve emailed your child with a redeem link and code for FL4SH Pro.',
  path: '/parents/thanks',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
