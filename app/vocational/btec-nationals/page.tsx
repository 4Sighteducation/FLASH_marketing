import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'
import StoreBadges from '../../components/StoreBadges'

export const metadata: Metadata = buildSeoMetadata({
  title: 'BTEC Nationals Revision | Vocational Flashcards | FL4SH',
  description:
    'BTEC Nationals revision flashcards for applied learning aims and key concepts. Revise with spaced repetition and exam-focused prompts.',
  path: '/vocational/btec-nationals',
})

export default function Page() {
  return (
    <SeoPage
      title="BTEC Nationals Revision"
      description="Specification-aligned revision prompts for BTEC Nationals."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Vocational', href: '/vocational' },
        { label: 'BTEC Nationals', href: '/vocational/btec-nationals' },
      ]}
      topCta={<StoreBadges />}
      links={[{ label: 'Cambridge Nationals', href: '/vocational/cambridge-nationals' }]}
    >
      <SeoCard title="Learn learning aims faster">
        <p>
          Break down each unit into short recall prompts and keep them active with spaced repetition—
          perfect for applied coursework and exam prep.
        </p>
      </SeoCard>

      <SeoCard title="Exam technique and application">
        <p>
          Use prompts that push you beyond definitions into applied examples, evaluation and
          justification—exactly what BTEC assessments reward.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

