import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'
import StoreBadges from '../../components/StoreBadges'

export const metadata: Metadata = buildSeoMetadata({
  title: 'AQA Flashcards | GCSE & A-Level Revision | FL4SH',
  description:
    'AQA flashcards aligned to AQA specifications for GCSE and A-Level. Revise by topic with spaced repetition and exam-focused prompts.',
  path: '/exam-boards/aqa',
})

export default function Page() {
  return (
    <SeoPage
      title="AQA Flashcards (GCSE & A-Level)"
      description="Revision flashcards aligned to AQA course structures."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Exam Boards', href: '/#subjects' },
        { label: 'AQA', href: '/exam-boards/aqa' },
      ]}
      topCta={<StoreBadges />}
      links={[
        { label: 'Edexcel', href: '/exam-boards/edexcel' },
        { label: 'OCR', href: '/exam-boards/ocr' },
        { label: 'GCSE Flashcards', href: '/gcse-flashcards' },
        { label: 'A-Level Flashcards', href: '/a-level-flashcards' },
      ]}
    >
      <SeoCard title="Why AQA alignment matters">
        <p>
          Exam boards differ in topic order, emphasis and language. Aligning your revision to AQA
          helps you spend time on what actually appears in AQA assessments.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

