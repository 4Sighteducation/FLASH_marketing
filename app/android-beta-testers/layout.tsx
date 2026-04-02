import type { Metadata } from 'next'
import { buildSeoMetadata } from '../lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Android Beta Testers — FL4SH',
  description:
    'Sign up to test FL4SH on Android before public release. Join the beta and help shape the app.',
  path: '/android-beta-testers',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
