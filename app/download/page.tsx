import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../components/SeoPage'
import StoreBadges from '../components/StoreBadges'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Download FL4SH | iOS & Android (Launching Feb 2026)',
  description:
    'Download FL4SH on iOS and Android. Apps launch February 2026 — join the waitlist and we’ll notify you when it’s live.',
  path: '/download',
})

export default function Page() {
  return (
    <SeoPage
      title="Download FL4SH (iOS & Android)"
      description="The mobile apps are launching February 2026. Join early access and we’ll notify you when downloads go live."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Download', href: '/download' },
      ]}
    >
      <SeoCard title="App Store & Google Play">
        <StoreBadges note="Launching February 2026 — we’ll update these links when the stores go live." />
      </SeoCard>

      <SeoCard title="Get notified">
        <p>
          Use the email box on the homepage to join early access. We’ll notify you when iOS and Android
          downloads are available.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

