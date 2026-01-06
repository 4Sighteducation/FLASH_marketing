import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'
import StoreBadges from '../../components/StoreBadges'

export const metadata: Metadata = buildSeoMetadata({
  title: 'OCR Flashcards | GCSE & A-Level Revision | FL4SH',
  description:
    'OCR flashcards aligned to OCR specifications for GCSE and A-Level. Revise by topic with spaced repetition and exam-focused prompts.',
  path: '/exam-boards/ocr',
})

export default function Page() {
  return (
    <SeoPage
      title="OCR Flashcards (GCSE & A-Level)"
      description="Revision flashcards aligned to OCR course structures."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Exam Boards', href: '/#subjects' },
        { label: 'OCR', href: '/exam-boards/ocr' },
      ]}
      topCta={<StoreBadges />}
      links={[
        { label: 'AQA', href: '/exam-boards/aqa' },
        { label: 'Edexcel', href: '/exam-boards/edexcel' },
        { label: 'GCSE Flashcards', href: '/gcse-flashcards' },
        { label: 'A-Level Flashcards', href: '/a-level-flashcards' },
      ]}
    >
      <SeoCard title="OCR-specific topic structure">
        <p>
          OCR specifications organize content differently across subjects. FL4SH keeps your revision
          mapped to the OCR structure so you focus on what’s assessed.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

