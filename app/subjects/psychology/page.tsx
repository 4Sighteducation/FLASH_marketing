import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Psychology Flashcards | GCSE & A-Level Psychology Revision | FL4SH',
  description:
    'Psychology flashcards for GCSE & A-Level: key studies, researchers, approaches, and evaluation points. Revise with spaced repetition and exam-focused prompts.',
  path: '/subjects/psychology',
})

export default function Page() {
  return (
    <SeoPage
      title="Psychology Flashcards (GCSE & A-Level)"
      description="Revision cards for approaches, key studies, terminology, and evaluation."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Subjects', href: '/#subjects' },
        { label: 'Psychology', href: '/subjects/psychology' },
      ]}
      links={[
        { label: 'Try the web app', href: 'https://app.fl4shcards.com' },
        { label: 'See all subjects', href: '/#subjects' },
      ]}
    >
      <SeoCard title="Key studies & researchers">
        <p>
          Turn each study into short prompts for aims, procedure, findings, strengths/limitations and
          real-world applications.
        </p>
      </SeoCard>

      <SeoCard title="Evaluation points that score marks">
        <p>
          Build a repeatable bank of evaluation points (methodology, ethics, validity, reliability)
          and retrieve them quickly in essays.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

