import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../components/SeoPage'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Scottish Qualifications (SQA) | Nationals & Highers | FL4SH',
  description:
    'Revision for Scottish qualifications. Explore Scottish Nationals and Highers and revise with spaced repetition and exam-focused prompts.',
  path: '/scotland',
})

export default function Page() {
  return (
    <SeoPage
      title="Scottish Qualifications (SQA)"
      description="Specification-aligned revision for Scottish Nationals and Highers."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Scotland (SQA)', href: '/scotland' },
      ]}
      links={[
        { label: 'Scottish Nationals', href: '/scotland/nationals' },
        { label: 'Scottish Highers', href: '/scotland/highers' },
      ]}
    >
      <SeoCard title="Scottish Nationals">
        <p>
          Build fast recall for key terms and processes and keep them fresh throughout the year with
          spaced repetition.
        </p>
      </SeoCard>

      <SeoCard title="Scottish Highers">
        <p>
          Highers demand understanding and application. Use exam-focused prompts to strengthen
          explanations, examples and evaluation.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

