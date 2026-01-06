import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../../components/SeoPage'
import StoreBadges from '../../components/StoreBadges'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Science Flashcards | GCSE & A-Level Biology, Chemistry & Physics | FL4SH',
  description:
    'GCSE & A-Level science flashcards aligned to specifications. Revise biology, chemistry and physics with spaced repetition and exam-focused prompts.',
  path: '/subjects/sciences',
})

export default function Page() {
  return (
    <SeoPage
      title="Science Flashcards (GCSE & A-Level)"
      description="Biology, Chemistry and Physics revision cards built from exam specifications."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Subjects', href: '/#subjects' },
        { label: 'Sciences', href: '/subjects/sciences' },
      ]}
      topCta={<StoreBadges />}
      links={[{ label: 'See all subjects', href: '/#subjects' }]}
    >
      <SeoCard title="Biology">
        <p>
          Cells, transport, enzymes, genetics, homeostasis, ecosystems and required practicals—turned
          into fast recall prompts.
        </p>
      </SeoCard>

      <SeoCard title="Chemistry">
        <p>
          Quantitative chemistry, bonding, rates, equilibrium, organic chemistry and analysis—perfect
          for definitions and key conditions.
        </p>
      </SeoCard>

      <SeoCard title="Physics">
        <p>
          Forces, energy, electricity, waves, particles and space—learn formulae, units and core
          explanations with spaced repetition.
        </p>
      </SeoCard>
    </SeoPage>
  )
}

