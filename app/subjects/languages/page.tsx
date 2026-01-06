import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Language Flashcards | GCSE & A-Level French, Spanish & German | FL4SH',
  description:
    'Language flashcards for GCSE & A-Level: vocabulary, grammar, tenses and exam prompts. Revise French, Spanish, German and more with spaced repetition.',
  path: '/subjects/languages',
})

export default function Page() {
  return (
    <SeoPage
      title="Language Flashcards (GCSE & A-Level)"
      description="Vocabulary, grammar and speaking/writing prompts for language exams."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Subjects', href: '/#subjects' },
        { label: 'Languages', href: '/subjects/languages' },
      ]}
      links={[
        { label: 'Try the web app', href: 'https://app.fl4shcards.com' },
        { label: 'See all subjects', href: '/#subjects' },
      ]}
    >
      <SeoCard title="Vocabulary that sticks">
        <p>
          Spaced repetition is ideal for language learning—review words and phrases at the right time
          to move them into long-term memory.
        </p>
      </SeoCard>

      <SeoCard title="Grammar & exam prompts">
        <p>
          Drill key structures and tenses, then practice writing/speaking prompts that match typical
          exam tasks.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

