import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'
import StoreBadges from '../../components/StoreBadges'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Edexcel Flashcards | GCSE & A-Level Revision | FL4SH',
  description:
    'Pearson Edexcel flashcards aligned to Edexcel specifications for GCSE and A-Level. Revise by topic with spaced repetition and exam-focused prompts.',
  path: '/exam-boards/edexcel',
})

export default function Page() {
  return (
    <SeoPage
      title="Edexcel Flashcards (GCSE & A-Level)"
      description="Revision flashcards aligned to Pearson Edexcel course structures."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Exam Boards', href: '/#subjects' },
        { label: 'Edexcel', href: '/exam-boards/edexcel' },
      ]}
      topCta={<StoreBadges />}
      links={[
        { label: 'AQA', href: '/exam-boards/aqa' },
        { label: 'OCR', href: '/exam-boards/ocr' },
        { label: 'GCSE Flashcards', href: '/gcse-flashcards' },
        { label: 'A-Level Flashcards', href: '/a-level-flashcards' },
      ]}
    >
      <SeoCard title="Specification-aligned revision">
        <p>
          Edexcel courses have their own structure and phrasing. FL4SH helps you revise with prompts
          aligned to the specification so you stay focused on exam-relevant content.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

