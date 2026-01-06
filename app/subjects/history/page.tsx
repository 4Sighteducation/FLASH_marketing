import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'

export const metadata: Metadata = buildSeoMetadata({
  title: 'History Flashcards | GCSE & A-Level History Revision | FL4SH',
  description:
    'History flashcards for GCSE & A-Level: key events, themes, timelines and exam technique. Revise with spaced repetition and structured prompts.',
  path: '/subjects/history',
})

export default function Page() {
  return (
    <SeoPage
      title="History Flashcards (GCSE & A-Level)"
      description="Revision cards for timelines, key concepts, causes/consequences and evaluation."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Subjects', href: '/#subjects' },
        { label: 'History', href: '/subjects/history' },
      ]}
      links={[
        { label: 'Try the web app', href: 'https://app.fl4shcards.com' },
        { label: 'See all subjects', href: '/#subjects' },
      ]}
    >
      <SeoCard title="Timelines you can actually remember">
        <p>
          Use short prompts to lock in key dates, turning points and the sequence of events—then
          practice linking them to themes.
        </p>
      </SeoCard>

      <SeoCard title="Exam paragraphs, faster">
        <p>
          Build recall for causes, consequences and interpretations so you can write structured
          paragraphs under timed conditions.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

