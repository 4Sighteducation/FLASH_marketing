import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../components/SeoPage'
import StoreBadges from '../components/StoreBadges'

export const metadata: Metadata = buildSeoMetadata({
  title: 'GCSE Flashcards | Revision by Exam Board & Subject | FL4SH',
  description:
    'GCSE flashcards aligned to official UK exam specifications. Revise by exam board and subject with spaced repetition and exam-focused prompts.',
  path: '/gcse-flashcards',
})

export default function Page() {
  return (
    <SeoPage
      title="GCSE Flashcards"
      description="Specification-aligned GCSE revision flashcards across major UK exam boards."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'GCSE Flashcards', href: '/gcse-flashcards' },
      ]}
      topCta={<StoreBadges />}
      links={[
        { label: 'A-Level Flashcards', href: '/a-level-flashcards' },
        { label: 'AQA', href: '/exam-boards/aqa' },
        { label: 'Edexcel', href: '/exam-boards/edexcel' },
        { label: 'OCR', href: '/exam-boards/ocr' },
      ]}
    >
      <SeoCard title="Built from exam specifications">
        <p>
          FL4SH is designed around what you’ll actually be assessed on—no generic decks, no guessing.
          Choose your exam board and revise with prompts aligned to the official topic structure.
        </p>
      </SeoCard>

      <SeoCard title="Subjects students use most">
        <p>
          Maths, Sciences and English are a great place to start—then expand into your full GCSE set.
          Use spaced repetition to keep key knowledge active throughout the year.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

