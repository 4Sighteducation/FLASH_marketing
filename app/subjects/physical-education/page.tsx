import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'
import StoreBadges from '../../components/StoreBadges'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Physical Education Flashcards | GCSE & A-Level PE Revision | FL4SH',
  description:
    'GCSE & A-Level Physical Education flashcards built from real exam specifications. Study PE topics, practice exam technique, and revise with spaced repetition.',
  path: '/subjects/physical-education',
})

export default function Page() {
  return (
    <SeoPage
      title="Physical Education Flashcards (GCSE & A-Level)"
      description="Revision flashcards aligned to PE specifications across major UK exam boards."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Subjects', href: '/#subjects' },
        { label: 'Physical Education', href: '/subjects/physical-education' },
      ]}
      topCta={<StoreBadges />}
      links={[{ label: 'See all subjects', href: '/#subjects' }]}
    >
      <SeoCard title="What you can revise">
        <p>
          Revise key PE areas like anatomy & physiology, skill acquisition, sport psychology,
          socio-cultural influences, health & wellbeing, and exam-style evaluation.
        </p>
      </SeoCard>

      <SeoCard title="Why FL4SH works for PE">
        <p>
          FL4SH is built around specifications and exam technique, with spaced repetition to help you
          retain definitions, applied examples, and evaluation points.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

