import type { Metadata } from 'next'
import { buildSeoMetadata } from '../lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Parents: Buy FL4SH Pro for Your Child — FL4SH',
  description:
    'Parents: purchase FL4SH Pro for your child’s account. Secure checkout, no app-store subscription required.',
  path: '/parents',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
