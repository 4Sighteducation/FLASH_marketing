import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'
import StoreBadges from '../../components/StoreBadges'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Cambridge Nationals Revision | Vocational Flashcards | FL4SH',
  description:
    'Cambridge Nationals revision flashcards built from specifications. Revise applied knowledge and assessment objectives with spaced repetition.',
  path: '/vocational/cambridge-nationals',
})

export default function Page() {
  return (
    <SeoPage
      title="Cambridge Nationals Revision"
      description="Specification-aligned flashcards and prompts for Cambridge Nationals."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Vocational', href: '/vocational' },
        { label: 'Cambridge Nationals', href: '/vocational/cambridge-nationals' },
      ]}
      topCta={<StoreBadges />}
      links={[{ label: 'BTEC Nationals', href: '/vocational/btec-nationals' }]}
    >
      <SeoCard title="Applied knowledge, made memorable">
        <p>
          Use flashcards for key terms, processes and exam command words—then apply them in practice
          tasks and past-paper questions.
        </p>
      </SeoCard>

      <SeoCard title="Revision built around the specification">
        <p>
          FL4SH is designed to map directly to the course structure so your revision stays aligned to
          what you’ll be assessed on.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

