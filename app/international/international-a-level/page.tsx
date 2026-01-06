import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'

export const metadata: Metadata = buildSeoMetadata({
  title: 'International A-Level Flashcards | Revision | FL4SH',
  description:
    'International A-Level revision prompts and flashcards for deeper understanding, application and exam technique. Study with spaced repetition.',
  path: '/international/international-a-level',
})

export default function Page() {
  return (
    <SeoPage
      title="International A-Level Revision"
      description="Exam-focused flashcards and prompts for International A-Level pathways."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'International', href: '/international' },
        { label: 'International A-Level', href: '/international/international-a-level' },
      ]}
      links={[
        { label: 'International GCSE (iGCSE)', href: '/international/igcse' },
        { label: 'Try the web app', href: 'https://app.fl4shcards.com' },
      ]}
    >
      <SeoCard title="Depth + exam technique">
        <p>
          International A-Levels reward depth and application. Use prompts that push you to explain,
          justify and evaluate—not just recall.
        </p>
      </SeoCard>

      <SeoCard title="Keep topics active through the year">
        <p>
          The Leitner system schedules reviews so you remember more in less time—perfect for long
          courses with lots of content.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

