import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'
import StoreBadges from '../../components/StoreBadges'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Business & Computer Science Flashcards | GCSE & A-Level Revision | FL4SH',
  description:
    'Business Studies, Economics and Computer Science flashcards for GCSE & A-Level. Revise definitions, models, and exam technique with spaced repetition.',
  path: '/subjects/business-and-it',
})

export default function Page() {
  return (
    <SeoPage
      title="Business & IT Flashcards (GCSE & A-Level)"
      description="Revision cards for Business Studies, Economics and Computer Science."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Subjects', href: '/#subjects' },
        { label: 'Business & IT', href: '/subjects/business-and-it' },
      ]}
      topCta={<StoreBadges />}
      links={[{ label: 'See all subjects', href: '/#subjects' }]}
    >
      <SeoCard title="Models & key definitions">
        <p>
          Memorise the terms, diagrams and evaluation points that turn short answers into full-mark
          responses.
        </p>
      </SeoCard>

      <SeoCard title="Exam technique">
        <p>
          Build fast retrieval for command words, calculation steps and structured evaluation—then
          apply it to exam-style questions.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

