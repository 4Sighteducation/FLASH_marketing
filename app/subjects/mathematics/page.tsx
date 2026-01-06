import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Maths Flashcards | GCSE & A-Level Mathematics Revision | FL4SH',
  description:
    'GCSE & A-Level maths flashcards aligned to exam specifications. Master definitions, methods, and exam technique with spaced repetition.',
  path: '/subjects/mathematics',
})

export default function Page() {
  return (
    <SeoPage
      title="Maths Flashcards (GCSE & A-Level)"
      description="Specification-aligned flashcards for GCSE & A-Level Mathematics."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Subjects', href: '/#subjects' },
        { label: 'Mathematics', href: '/subjects/mathematics' },
      ]}
      links={[
        { label: 'Try the web app', href: 'https://app.fl4shcards.com' },
        { label: 'See all subjects', href: '/#subjects' },
      ]}
    >
      <SeoCard title="What you’ll cover">
        <p>
          Revise core methods and exam-style questions across number, algebra, geometry, trigonometry,
          statistics and probability. Ideal for quick recall and step-by-step procedures.
        </p>
      </SeoCard>

      <SeoCard title="How to use FL4SH for maths">
        <p>
          Turn topics into short recall prompts, then use spaced repetition to keep methods fresh. Mix
          flashcards with past-paper practice for full exam technique.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

