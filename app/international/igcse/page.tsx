import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'
import StoreBadges from '../../components/StoreBadges'

export const metadata: Metadata = buildSeoMetadata({
  title: 'International GCSE (iGCSE) Flashcards | Revision | FL4SH',
  description:
    'International GCSE (iGCSE) revision prompts and flashcards built for exam-focused recall and spaced repetition.',
  path: '/international/igcse',
})

export default function Page() {
  return (
    <SeoPage
      title="International GCSE (iGCSE) Revision"
      description="Exam-focused flashcards and prompts for iGCSE pathways."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'International', href: '/international' },
        { label: 'iGCSE', href: '/international/igcse' },
      ]}
      topCta={<StoreBadges />}
      links={[{ label: 'International A-Level', href: '/international/international-a-level' }]}
    >
      <SeoCard title="Built for international schools">
        <p>
          FL4SH is designed for students studying UK-style qualifications worldwide, with
          specification-aligned topic structures and exam technique.
        </p>
      </SeoCard>

      <SeoCard title="Spaced repetition that works">
        <p>
          Use the 5-box Leitner method to keep key knowledge active across the year—ideal for iGCSE
          courses with lots of content.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

