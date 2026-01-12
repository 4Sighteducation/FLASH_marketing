import Image from 'next/image'
import Navigation from '../components/Navigation'
import SchoolWebinarSignup from '../components/SchoolWebinarSignup'
import styles from '../page.module.css'

export const metadata = {
  title: 'Schools: Free VESPA “Supercharged Revision” Webinar + FL4SH Early Access',
  description:
    'Schools: book a free 60-minute VESPA Academy student revision webinar (usually £350) by registering interest in FL4SH.',
}

export default function SchoolsPage() {
  return (
    <>
      <Navigation />
      <main className={styles.main}>
        <section className={styles.hero} style={{ minHeight: 'auto', paddingTop: '9rem' }}>
          <div className={styles.heroBackground}>
            <div className={styles.gridOverlay}></div>
            <div className={`${styles.glowOrb} ${styles.glowOrb1}`}></div>
            <div className={`${styles.glowOrb} ${styles.glowOrb2}`}></div>
          </div>

          <div className={styles.container}>
            <div className={styles.heroContent}>
              <div className={styles.logoContainer}>
                <Image
                  src="/flash_assets/flash-logo-transparent.png"
                  alt="FL4SH"
                  width={170}
                  height={170}
                  className={`${styles.heroLogo} ${styles.glowPulse}`}
                  priority
                />
              </div>

              <h1 className={styles.heroTitle}>
                Schools: boost student outcomes with{' '}
                <span className={styles.gradientText}>better revision</span>
              </h1>

              <p className={styles.heroSubtitle}>
                Register interest in <span className={styles.neonText}>FL4SH</span> and qualify for a free{' '}
                <span className={styles.neonTextPink}>VESPA Academy</span> 60-minute student webinar:
                <br />
                <strong>“Supercharged Revision”</strong> (usually <strong>£350</strong>).
              </p>

              <div style={{ marginTop: '2rem' }}>
                <SchoolWebinarSignup />
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <p className={styles.sectionSubtitle} style={{ maxWidth: 900 }}>
                  FL4SH is an AI-powered flashcard and exam practice platform built from{' '}
                  <strong>official UK exam specifications</strong> (GCSE &amp; A-Level). It supports all major exam
                  boards (AQA, Edexcel, OCR, WJEC, CCEA, SQA) and combines spaced repetition (Leitner) with exam-trained
                  AI and past paper integration.
                </p>
                <p className={styles.sectionSubtitle} style={{ maxWidth: 900, marginTop: '0.75rem' }}>
                  Brought to you by{' '}
                  <a href="https://www.vespa.academy/" className={styles.neonText} style={{ fontWeight: 900 }}>
                    VESPA Academy
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

