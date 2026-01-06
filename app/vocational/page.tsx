import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../components/SeoPage'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Vocational Qualifications | Cambridge Nationals & BTEC Nationals | FL4SH',
  description:
    'Vocational revision built for real specifications. Explore Cambridge Nationals and BTEC Nationals and revise with spaced repetition and exam-focused prompts.',
  path: '/vocational',
})

export default function Page() {
  return (
    <SeoPage
      title="Vocational Qualifications"
      description="Specification-aligned revision for vocational awards."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Vocational', href: '/vocational' },
      ]}
      links={[
        { label: 'Cambridge Nationals', href: '/vocational/cambridge-nationals' },
        { label: 'BTEC Nationals', href: '/vocational/btec-nationals' },
      ]}
    >
      <SeoCard title="Cambridge Nationals">
        <p>
          Cambridge Nationals are vocational courses with applied assessment. FL4SH helps you revise
          key terms, processes and exam-style prompts from the specification.
        </p>
      </SeoCard>

      <SeoCard title="BTEC Nationals">
        <p>
          BTEC Nationals combine units, learning aims and applied coursework. Use FL4SH to keep key
          knowledge fresh with spaced repetition.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

