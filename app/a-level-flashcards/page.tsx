import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../components/SeoPage'
import StoreBadges from '../components/StoreBadges'

export const metadata: Metadata = buildSeoMetadata({
  title: 'A-Level Flashcards | Revision by Exam Board & Subject | FL4SH',
  description:
    'A-Level flashcards aligned to official UK exam specifications. Revise with spaced repetition and exam-focused prompts across major exam boards.',
  path: '/a-level-flashcards',
})

export default function Page() {
  return (
    <SeoPage
      title="A-Level Flashcards"
      description="Specification-aligned A-Level revision flashcards across major UK exam boards."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'A-Level Flashcards', href: '/a-level-flashcards' },
      ]}
      topCta={<StoreBadges />}
      links={[
        { label: 'GCSE Flashcards', href: '/gcse-flashcards' },
        { label: 'AQA', href: '/exam-boards/aqa' },
        { label: 'Edexcel', href: '/exam-boards/edexcel' },
        { label: 'OCR', href: '/exam-boards/ocr' },
      ]}
    >
      <SeoCard title="Depth + exam technique">
        <p>
          A-Levels reward depth and application. Use prompts that push you to explain, justify and
          evaluate—not just recall.
        </p>
      </SeoCard>

      <SeoCard title="Stay aligned to your board">
        <p>
          Every board structures content slightly differently. FL4SH is built to keep your revision
          mapped to your specific course.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

