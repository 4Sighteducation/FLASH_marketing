import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'
import StoreBadges from '../../components/StoreBadges'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Humanities Flashcards | GCSE & A-Level Revision | FL4SH',
  description:
    'Humanities flashcards for GCSE & A-Level: history, geography, psychology and sociology. Revise key studies, case examples and exam technique.',
  path: '/subjects/humanities',
})

export default function Page() {
  return (
    <SeoPage
      title="Humanities Flashcards (GCSE & A-Level)"
      description="Revision cards for History, Geography, Psychology and Sociology."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Subjects', href: '/#subjects' },
        { label: 'Humanities', href: '/subjects/humanities' },
      ]}
      topCta={<StoreBadges />}
      links={[{ label: 'See all subjects', href: '/#subjects' }]}
    >
      <SeoCard title="History & Geography">
        <p>
          Timelines, causes/consequences, key terms and case studies—ideal for fast retrieval and
          structured paragraphs.
        </p>
      </SeoCard>

      <SeoCard title="Psychology & Sociology">
        <p>
          Key studies, researchers, concepts, evaluation points and essay structures—built for exam
          technique as well as recall.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

