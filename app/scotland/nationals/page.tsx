import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'
import StoreBadges from '../../components/StoreBadges'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Scottish Nationals Revision | SQA National Flashcards | FL4SH',
  description:
    'Scottish Nationals revision prompts built to support SQA course structures. Revise with spaced repetition and exam-focused practice.',
  path: '/scotland/nationals',
})

export default function Page() {
  return (
    <SeoPage
      title="Scottish Nationals Revision"
      description="Specification-aligned flashcards and prompts for SQA Nationals."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Scotland (SQA)', href: '/scotland' },
        { label: 'Nationals', href: '/scotland/nationals' },
      ]}
      topCta={<StoreBadges />}
      links={[{ label: 'Scottish Highers', href: '/scotland/highers' }]}
    >
      <SeoCard title="Revise little and often">
        <p>
          Use spaced repetition to lock in key terminology and processes, then combine with exam-style
          questions for confidence.
        </p>
      </SeoCard>

      <SeoCard title="Stay aligned to assessment">
        <p>
          Keep your revision focused on what the course is assessing—no filler, no generic decks.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

