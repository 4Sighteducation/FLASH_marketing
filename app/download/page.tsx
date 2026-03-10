import type { Metadata } from 'next'
import SeoPage, { buildSeoMetadata, SeoCard } from '../components/SeoPage'
import StoreBadges from '../components/StoreBadges'

const APP_STORE_URL = 'https://apps.apple.com/in/app/fl4sh-study-smarter/id6747457678'
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.foursighteducation.flash'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Download FL4SH | iOS & Android Apps Available Now',
  description:
    'Download FL4SH now on iOS App Store and Google Play. AI-powered flashcards for GCSE & A-Level revision.',
  path: '/download',
})

export default function Page() {
  return (
    <SeoPage
      title="Download FL4SH (iOS & Android)"
      description="FL4SH is now available on iOS and Android. Download free and start studying in minutes."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Download', href: '/download' },
      ]}
    >
      <SeoCard title="📱 Download Now">
        <StoreBadges />
        <div style={{ marginTop: '1.5rem' }}>
          <p><strong>Get started in seconds:</strong></p>
          <ol style={{ marginTop: '0.5rem', lineHeight: '1.8' }}>
            <li>Download FL4SH from your app store</li>
            <li>Create a free account</li>
            <li>Choose your exam board and subjects</li>
            <li>Start studying</li>
          </ol>
        </div>
      </SeoCard>

      <SeoCard title="👨‍👩‍👧 Parents & guardians: buy Pro for your child">
        <p style={{ marginBottom: '0.75rem' }}>
          FL4SH is free to download. If you want to unlock <strong>Pro</strong> for your child, you can purchase Pro on our
          website and we’ll email them a redeem code.
        </p>
        <p style={{ marginBottom: '0.75rem' }}>
          <a href="/parents"><strong>Buy Pro for your child →</strong></a>
        </p>
        <p style={{ fontSize: '0.875rem', opacity: '0.8' }}>
          Your child activates Pro in the app via <strong>Profile → Redeem code</strong>.
        </p>
      </SeoCard>

      <SeoCard title="📊 What You Get">
        <ul style={{ lineHeight: '1.8' }}>
          <li><strong>10,000+ exam specification topics</strong> across all UK boards</li>
          <li><strong>AI-powered flashcard generation</strong> trained on past papers</li>
          <li><strong>Voice answer analysis</strong> with AI feedback</li>
          <li><strong>5-box Leitner spaced repetition</strong> system</li>
          <li><strong>Past papers integration</strong> with mark schemes</li>
        </ul>
      </SeoCard>

      <SeoCard title="💎 Pro Features">
        <p style={{ marginBottom: '1rem' }}>
          Pro unlocks the full FL4SH experience:
        </p>
        <ul style={{ lineHeight: '1.8' }}>
          <li>Unlimited subjects and flashcards</li>
          <li>Full past papers library with mark schemes</li>
          <li>Unlimited AI card generation</li>
          <li>Voice answer analysis</li>
          <li>Advanced analytics and insights</li>
        </ul>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', opacity: '0.8' }}>
          Pro pricing: £3.99/month or £39.99/year (2 months free).
        </p>
      </SeoCard>

      <SeoCard title="🎓 All UK Exam Boards Supported">
        <p>
          FL4SH supports <strong>AQA, Pearson Edexcel, OCR, WJEC/Eduqas, CCEA, and SQA</strong> for GCSE, A-Level, AS-Level, 
          Scottish National 5, Highers, and Advanced Highers.
        </p>
      </SeoCard>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <StoreBadges showNote={false} />
      </div>
    </SeoPage>
  )
}
