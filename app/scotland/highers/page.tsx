import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'
import StoreBadges from '../../components/StoreBadges'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Scottish Highers Revision | SQA Higher Flashcards | FL4SH',
  description:
    'Scottish Highers revision prompts built from course structures. Revise with spaced repetition and exam technique.',
  path: '/scotland/highers',
})

export default function Page() {
  return (
    <SeoPage
      title="Scottish Highers Revision"
      description="Exam-focused flashcards and prompts for SQA Highers."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Scotland (SQA)', href: '/scotland' },
        { label: 'Highers', href: '/scotland/highers' },
      ]}
      topCta={<StoreBadges />}
      links={[{ label: 'Scottish Nationals', href: '/scotland/nationals' }]}
    >
      <SeoCard title="Build deep understanding">
        <p>
          Use prompts that target explanations and application, not just definitions—ideal for Higher
          level assessment.
        </p>
      </SeoCard>

      <SeoCard title="Spaced repetition for long-term recall">
        <p>
          Keep key ideas active through the year so you’re not relearning everything right before the
          exam.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

