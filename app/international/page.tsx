import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../components/SeoPage'

export const metadata: Metadata = buildSeoMetadata({
  title: 'International Qualifications | International GCSE & A-Level | FL4SH',
  description:
    'International qualifications revision pages. Explore International GCSE (iGCSE) and International A-Levels with exam-focused flashcards and spaced repetition.',
  path: '/international',
})

export default function Page() {
  return (
    <SeoPage
      title="International Qualifications"
      description="Revision support for international pathways, taught worldwide."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'International', href: '/international' },
      ]}
      links={[
        { label: 'International GCSE (iGCSE)', href: '/international/igcse' },
        { label: 'International A-Level', href: '/international/international-a-level' },
      ]}
    >
      <SeoCard title="International GCSE (iGCSE)">
        <p>
          Build recall and confidence with exam-focused prompts aligned to typical topic structures
          and assessment styles.
        </p>
      </SeoCard>

      <SeoCard title="International A-Level">
        <p>
          Strengthen depth and application with spaced repetition, then apply knowledge through exam
          technique and practice questions.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

