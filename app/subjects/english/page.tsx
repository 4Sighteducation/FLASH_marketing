import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'

export const metadata: Metadata = buildSeoMetadata({
  title: 'English Flashcards | GCSE & A-Level English Revision | FL4SH',
  description:
    'English flashcards for GCSE & A-Level: key quotes, terminology, context, and exam techniques. Revise with spaced repetition and exam-focused prompts.',
  path: '/subjects/english',
})

export default function Page() {
  return (
    <SeoPage
      title="English Flashcards (GCSE & A-Level)"
      description="Revision cards for English Language and English Literature."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Subjects', href: '/#subjects' },
        { label: 'English', href: '/subjects/english' },
      ]}
      links={[
        { label: 'Try the web app', href: 'https://app.fl4shcards.com' },
        { label: 'See all subjects', href: '/#subjects' },
      ]}
    >
      <SeoCard title="English Literature">
        <p>
          Quotes, themes, character arcs, context and critical vocabulary—built into short prompts for
          rapid recall and essay planning.
        </p>
      </SeoCard>

      <SeoCard title="English Language">
        <p>
          Techniques, terminology and structure—practice spotting methods and writing high-mark
          responses with a clear toolkit.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

