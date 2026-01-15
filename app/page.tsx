'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import Navigation from './components/Navigation'
import LaunchBanner from './components/LaunchBanner'
import ComingSoonButton from './components/ComingSoonButton'
import AndroidBetaPopup from './components/AndroidBetaPopup'
import StoreBadges from './components/StoreBadges'
import SchoolWebinarSignup from './components/SchoolWebinarSignup'
import styles from './page.module.css'

export default function Home() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  const pricing = useMemo(() => {
    if (billing === 'annual') {
      return {
        pro: { amount: '£39.99', suffix: '/year' },
      };
    }
    return {
      pro: { amount: '£3.99', suffix: '/month' },
    };
  }, [billing]);

  // FAQ Schema for Google
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How is FL4SH different from Quizlet or Anki?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "FL4SH is the ONLY app built directly from official exam specifications. We load your exact exam board's topic list - not generic flashcards. Plus AI trained on real past papers and mark schemes."
        }
      },
      {
        "@type": "Question",
        "name": "What are the 5 Leitner Boxes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Box 1 (Daily), Box 2 (Every 2 days), Box 3 (Every 3 days), Box 4 (Weekly), Box 5 (Mastered/Retired). Cards move up as you get them right, but ANY wrong answer sends them back to Box 1!"
        }
      },
      {
        "@type": "Question",
        "name": "Does FL4SH include past papers?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! We have thousands of real past paper questions, official mark schemes, and examiners reports integrated into every topic. Study from the actual exam content."
        }
      },
      {
        "@type": "Question",
        "name": "What exam boards are supported?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "All major UK exam boards: AQA, Edexcel, OCR, WJEC, CCEA, and SQA for both GCSE and A-Level. International exams (IB, iGCSE) coming soon!"
        }
      }
    ]
  };

  const features = [
    {
      icon: '📋',
      title: 'Exact Exam Specifications',
      description: 'Search by YOUR exam board and course. We load the exact topic list from your exam specification - over 10,000 topics and subtopics across all UK exam boards.',
      accent: 'cyan'
    },
    {
      icon: '🤖',
      title: 'Exam-Trained AI',
      description: 'Our AI has been trained on past papers, mark schemes, and examiners reports. It creates flashcards based on the EXACT content you\'ll face in your exam.',
      accent: 'pink'
    },
    {
      icon: '📦',
      title: '5-Box Leitner System',
      description: 'Master the famous Leitner method updated for the 21st century. Move cards through 5 memory boxes from daily review to long-term mastery.',
      accent: 'cyan'
    },
    {
      icon: '🎤',
      title: 'AI Voice Analysis',
      description: 'Speak your essay answers out loud - our AI listens, analyzes, and gives detailed feedback. The most effective revision method, now AI-powered.',
      accent: 'pink'
    },
    {
      icon: '📄',
      title: 'Past Papers Included',
      description: 'Thousands of real past paper questions, official mark schemes, and examiners reports built into every topic.',
      accent: 'cyan'
    },
    {
      icon: '🌍',
      title: 'All UK Exam Boards',
      description: 'AQA, Edexcel, OCR, WJEC, CCEA, SQA - every major exam board covered. International exams coming soon!',
      accent: 'pink'
    }
  ];

  return (
    <>
      {/* FAQ Schema for Google Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <Navigation />
      <LaunchBanner />
      <AndroidBetaPopup />
      <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
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
                alt="FL4SH AI-powered flashcards for GCSE and A-Level exam revision" 
                width={200} 
                height={200}
                className={`${styles.heroLogo} ${styles.glowPulse}`}
                priority
              />
            </div>
            
            <h1 className={styles.heroTitle}>
              Ace Your <span className={styles.gradientText}>GCSEs & A-Levels</span>
              <br />
              With <span className={`${styles.neonTextPink} ${styles.neonFlicker}`}>AI-Powered</span> Flashcards
            </h1>
            
            <p className={styles.heroSubtitle}>
              The only flashcard app built from <span className={styles.neonText}>real exam specifications</span>.
              Over 10,000 topics, thousands of past papers, and AI trained on mark schemes.
              Study smarter with <span className={styles.neonTextPink}>the famous Leitner Box method</span>.
            </p>
            
            <div className={styles.ctaButtons}>
              <ComingSoonButton variant="primary" className={styles.btn}>
                ⚡ Get Pro free for 30 days
              </ComingSoonButton>
              <a href="#features" className={`${styles.btn} ${styles.btnSecondary}`}>
                See How It Works →
              </a>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <StoreBadges note="Apps launching February 2026 (download links coming soon)" />
            </div>
            
            <div className={styles.trustBadges}>
              <div className={styles.trustBadge}>
                <span className={styles.neonText}>✓</span> Free to start
              </div>
              <div className={styles.trustBadge}>
                <span className={styles.neonText}>✓</span> No credit card required
              </div>
              <div className={styles.trustBadge}>
                <span className={styles.neonTextPink}>✓</span> 10,000+ students
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Why Students <span className={styles.gradientText}>Love FL4SH</span>
            </h2>
            <p className={styles.sectionSubtitle}>
              Everything you need to ace your exams. Nothing you don't.
            </p>
          </div>
          
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`${styles.featureCard} ${styles.card} ${feature.accent === 'pink' ? styles.cardPink : ''}`}
              >
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Different Section */}
      <section className={styles.whyDifferent}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>
            Why FL4SH is <span className={styles.neonTextPink}>Different</span>
          </h2>
          
          <div className={styles.comparisonGrid}>
            <div className={styles.comparisonCard}>
              <h3>❌ Other Flashcard Apps</h3>
              <ul>
                <li>Generic flashcards made by random users</li>
                <li>No exam board alignment</li>
                <li>No past paper integration</li>
                <li>Basic spaced repetition</li>
                <li>No AI feedback on answers</li>
              </ul>
            </div>
            
            <div className={`${styles.comparisonCard} ${styles.comparisonHighlight}`}>
              <h3 className={styles.neonText}>✓ FL4SH</h3>
              <ul>
                <li><strong>Official exam specifications</strong> - your exact syllabus</li>
                <li><strong>Your exam board</strong> - AQA, Edexcel, OCR, WJEC, etc.</li>
                <li><strong>Real past papers</strong> - thousands included</li>
                <li><strong>Advanced Leitner boxes</strong> - 5-box progression system</li>
                <li><strong>AI voice analysis</strong> - speak answers, get feedback</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects Covered */}
      <section id="subjects" className={styles.subjectsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>
            Every <span className={styles.gradientText}>GCSE & A-Level Subject</span> Covered
          </h2>
          <p className={styles.sectionSubtitle}>
            Over 10,000 exam specification topics and subtopics across all UK exam boards (AQA, Edexcel, OCR, WJEC, CCEA, SQA).
            <br />Plus thousands of past paper questions, mark schemes, and examiners reports.
          </p>

          <div style={{ marginTop: '2rem' }}>
            <div className={styles.subjectsGrid} style={{ marginTop: 0 }}>
              <a className={styles.subjectCard} href="/gcse-flashcards">
                <h3>🎓 GCSE Flashcards</h3>
                <p>Specification-aligned revision by exam board & subject</p>
              </a>
              <a className={styles.subjectCard} href="/a-level-flashcards">
                <h3>🏅 A-Level Flashcards</h3>
                <p>Deep recall + exam technique for A-Level courses</p>
              </a>
              <a className={styles.subjectCard} href="/exam-boards/aqa">
                <h3>🏛️ Exam Boards</h3>
                <p>AQA • Edexcel • OCR (and more)</p>
              </a>
            </div>
          </div>
          
          <div className={styles.subjectsGrid}>
            <a className={styles.subjectCard} href="/subjects/mathematics">
              <h3>📐 Mathematics</h3>
              <p>GCSE & A-Level Maths, Further Maths, Statistics</p>
            </a>
            <a className={styles.subjectCard} href="/subjects/sciences">
              <h3>🧪 Sciences</h3>
              <p>Biology, Chemistry, Physics (Combined & Separate)</p>
            </a>
            <a className={styles.subjectCard} href="/subjects/english">
              <h3>📚 English</h3>
              <p>Literature, Language, Creative Writing</p>
            </a>
            <a className={styles.subjectCard} href="/subjects/history">
              <h3>🏛️ History</h3>
              <p>Timelines, themes, causes & consequences</p>
            </a>
            <a className={styles.subjectCard} href="/subjects/humanities">
              <h3>🌍 Humanities</h3>
              <p>History, Geography, Psychology, Sociology</p>
            </a>
            <a className={styles.subjectCard} href="/subjects/psychology">
              <h3>🧠 Psychology</h3>
              <p>Key studies, evaluation, essay technique</p>
            </a>
            <a className={styles.subjectCard} href="/subjects/languages">
              <h3>🗣️ Languages</h3>
              <p>French, Spanish, German, and more</p>
            </a>
            <a className={styles.subjectCard} href="/subjects/business-and-it">
              <h3>💼 Business & IT</h3>
              <p>Business Studies, Economics, Computer Science</p>
            </a>
            <a className={styles.subjectCard} href="/subjects/physical-education">
              <h3>🏃 Physical Education</h3>
              <p>GCSE & A-Level PE (specification-aligned revision)</p>
            </a>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p className={styles.sectionSubtitle} style={{ marginBottom: '1rem' }}>
              Also supported: vocational, Scottish & international pathways
            </p>
            <div className={styles.subjectsGrid} style={{ marginTop: 0 }}>
              <a className={styles.subjectCard} href="/vocational">
                <h3>🧰 Vocational Awards</h3>
                <p>Cambridge Nationals • BTEC Nationals</p>
              </a>
              <a className={styles.subjectCard} href="/scotland">
                <h3>🏴 Scotland (SQA)</h3>
                <p>Scottish Nationals • Scottish Highers</p>
              </a>
              <a className={styles.subjectCard} href="/international">
                <h3>🌍 International</h3>
                <p>International GCSE (iGCSE) • International A-Level</p>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Detailed */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>
            How <span className={styles.neonTextPink}>FL4SH</span> Works
          </h2>
          
          {/* Leitner Box Visual */}
          <div className={styles.leitnerVisual}>
            <Image 
              src="/leitner-neon-animation-v2.gif" 
              alt="FL4SH 5-box Leitner spaced repetition system for GCSE and A-Level revision showing card progression" 
              width={1200} 
              height={675}
              className={styles.leitnerGif}
              unoptimized
            />
            <p className={styles.leitnerCaption}>
              <span className={styles.neonText}>Correct answers</span> move cards forward • 
              <span className={styles.neonTextPink}> Wrong answers</span> send them back to Box 1
            </p>
          </div>
          
          <div className={styles.stepsDetailed}>
            <div className={styles.stepDetail}>
              <div className={styles.stepNumber}>01</div>
              <div className={styles.stepContent}>
                <h3>Select Your Exact Course</h3>
                <p>Choose GCSE or A-Level, select YOUR specific exam board (AQA, Edexcel, OCR, WJEC, CCEA, SQA), and pick your subjects. FL4SH loads the EXACT topic list from your exam specification - over 10,000 topics and subtopics.</p>
              </div>
            </div>
            
            <div className={styles.stepDetail}>
              <div className={styles.stepNumber}>02</div>
              <div className={styles.stepContent}>
                <h3>AI Creates Exam-Specific Cards</h3>
                <p>Our AI has been trained on thousands of past papers, mark schemes, and examiners reports. It creates flashcards based on the EXACT content you'll face in your exam - not generic content.</p>
              </div>
            </div>
            
            <div className={styles.stepDetail}>
              <div className={styles.stepNumber}>03</div>
              <div className={styles.stepContent}>
                <h3>Master the 5-Box Leitner System</h3>
                <p><strong>Box 1 (Daily):</strong> New cards + any you get wrong<br />
                <strong>Box 2 (Every 2 days):</strong> Cards you answered correctly once<br />
                <strong>Box 3 (Every 3 days):</strong> Cards answered correctly twice<br />
                <strong>Box 4 (Weekly):</strong> Cards you're getting consistent<br />
                <strong>Box 5 (Retired):</strong> Mastered! Random challenges only<br />
                <span className={styles.neonTextPink}>⚠️ Get any card wrong? It goes back to Box 1!</span></p>
              </div>
            </div>
            
            <div className={styles.stepDetail}>
              <div className={styles.stepNumber}>04</div>
              <div className={styles.stepContent}>
                <h3>Speak Your Answers (AI Voice Analysis)</h3>
                <p>One of the most effective revision methods is speaking answers out loud. Choose an essay-style flashcard, speak your answer, and our AI analyzes it - giving you detailed feedback on accuracy, depth, and exam technique.</p>
              </div>
            </div>
          </div>
          
          <div className={styles.ctaCenter}>
            <ComingSoonButton variant="primary" className={styles.btn}>
              Start Learning Free →
            </ComingSoonButton>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={styles.pricingSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>
            Your first month is <span className={styles.gradientText}>Pro — free</span>
          </h2>
          <p className={styles.pricingIntro}>
            Get full Pro access for 30 days. No credit card required to start.
          </p>

          <div className={styles.trialGrid}>
            {/* Month 1: Pro (free) */}
            <div className={`${styles.trialCard} ${styles.card} ${styles.cardPink} ${styles.trialFeatured}`}>
              <div className={styles.badge}>FREE MONTH</div>
              <h3 className={styles.trialTitle}>Month 1: Pro (free)</h3>
              <p className={styles.trialText}>
                Start with full access and see how much progress you can make in 30 days.
              </p>
              <ul className={styles.features}>
                <li>✓ Unlimited subjects & flashcards</li>
                <li>✓ Past papers & mark schemes</li>
                <li>✓ AI card generation + voice analysis</li>
                <li>✓ Advanced analytics</li>
              </ul>
              <ComingSoonButton variant="primary" className={styles.btn}>
                Get Pro free for 30 days
              </ComingSoonButton>
              <p className={styles.smallNote}>No credit card required to start.</p>
            </div>

            {/* After: choose a plan */}
            <div className={`${styles.trialCard} ${styles.card}`}>
              <div className={styles.badge}>{billing === 'annual' ? '2 MONTHS FREE' : 'KEEP PRO'}</div>
              <h3 className={styles.trialTitle}>After that: keep studying like a Pro</h3>
              <p className={styles.trialText}>
                If FL4SH is helping, keep Pro so you keep everything you’ve built.
              </p>

              <div className={styles.billingToggleWrap} style={{ marginTop: '0.5rem' }}>
                <div className={styles.billingToggle} role="tablist" aria-label="Billing period">
                  <button
                    type="button"
                    className={`${styles.billingOption} ${billing === 'monthly' ? styles.billingOptionActive : ''}`}
                    onClick={() => setBilling('monthly')}
                    aria-selected={billing === 'monthly'}
                    role="tab"
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    className={`${styles.billingOption} ${billing === 'annual' ? styles.billingOptionActive : ''}`}
                    onClick={() => setBilling('annual')}
                    aria-selected={billing === 'annual'}
                    role="tab"
                  >
                    Annual
                  </button>
                </div>
                <p className={styles.billingHint}>
                  {billing === 'annual' ? '£39.99/year (2 months free)' : '£3.99/month'}
                </p>
              </div>
            </div>

            {/* Free fallback */}
            <div className={`${styles.trialCard} ${styles.card}`}>
              <div className={styles.badge}>FREE TIER</div>
              <h3 className={styles.trialTitle}>Not ready? Stay on Free</h3>
              <p className={styles.trialText}>
                No problem — your account stays active.
              </p>
              <ul className={styles.features}>
                <li>✓ 1 subject</li>
                <li>✓ 10 flashcards</li>
                <li>✓ Basic study mode</li>
                <li>✕ No Past Papers</li>
              </ul>
              <p className={styles.smallPrint}>
                After your free month ends, if you don’t keep Pro, your cards, subjects and progress from the Pro month will be
                reset and you’ll move to the Free tier limits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faqSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>
            Frequently Asked <span className={styles.neonText}>Questions</span>
          </h2>
          
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h3>How is FL4SH different from Quizlet or Anki?</h3>
              <p>FL4SH is the ONLY app built directly from official exam specifications. We load your exact exam board's topic list - not generic flashcards. Plus AI trained on real past papers and mark schemes.</p>
            </div>
            
            <div className={styles.faqItem}>
              <h3>What are the 5 Leitner Boxes?</h3>
              <p>Box 1 (Daily), Box 2 (Every 2 days), Box 3 (Every 3 days), Box 4 (Weekly), Box 5 (Mastered/Retired). Cards move up as you get them right, but ANY wrong answer sends them back to Box 1!</p>
            </div>
            
            <div className={styles.faqItem}>
              <h3>Does FL4SH include past papers?</h3>
              <p>Yes! We have thousands of real past paper questions, official mark schemes, and examiners reports integrated into every topic. Study from the actual exam content.</p>
            </div>
            
            <div className={styles.faqItem}>
              <h3>How does the AI voice analysis work?</h3>
              <p>Choose an essay-style flashcard, tap the microphone, speak your answer out loud, and our AI analyzes it - giving detailed feedback on accuracy, exam technique, and what examiners look for.</p>
            </div>
            
            <div className={styles.faqItem}>
              <h3>What exam boards are supported?</h3>
              <p>All major UK exam boards: AQA, Edexcel, OCR, WJEC, CCEA, and SQA for both GCSE and A-Level. International exams (IB, iGCSE) coming soon!</p>
            </div>
            
            <div className={styles.faqItem}>
              <h3>Can I cancel anytime?</h3>
              <p>Absolutely. No contracts, no commitments. Cancel your subscription anytime with one click. Plus we have a generous free tier to start.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Schools webinar CTA */}
      <section className={styles.finalCta}>
        <div className={styles.container}>
          <h2 className={styles.finalCtaTitle}>
            Schools: book a <span className={styles.gradientText}>free</span> student webinar
          </h2>
          <p className={styles.finalCtaText}>
            Get a free 60-minute “Supercharged Revision” student webinar from VESPA Academy (usually £350) by registering
            interest in FL4SH.
          </p>
          <div style={{ marginTop: '1.75rem' }}>
            <SchoolWebinarSignup />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <div className={styles.container}>
          <h2 className={styles.finalCtaTitle}>
            Ready to <span className={styles.gradientText}>Ace Your Exams?</span>
          </h2>
          <p className={styles.finalCtaText}>
            Join 10,000+ students already using FL4SH to study smarter, not harder
          </p>
          <div className={styles.ctaButtons}>
            <ComingSoonButton variant="primary" className={`${styles.btn} ${styles.btnLarge}`}>
              Get Started Free →
            </ComingSoonButton>
          </div>
          <p className={styles.finalCtaNote}>
            <span className={styles.neonText}>✓</span> No credit card required • 
            <span className={styles.neonText}>✓</span> 2-minute setup • 
            <span className={styles.neonTextPink}>✓</span> Start studying immediately
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <Image src="/flash_assets/flash-logo-transparent.png" alt="FL4SH" width={60} height={60} />
              <p>AI-powered flashcards for GCSE & A-Level students</p>
            </div>
            <div className={styles.footerLinks}>
              <div>
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#subjects">Subjects</a>
                <a href="#pricing">Pricing</a>
                <a href="/download">Download</a>
              </div>
              <div>
                <h4>Download</h4>
                <a href="/download">iOS App (Feb 2026)</a>
                <a href="/download">Android App (Feb 2026)</a>
                <a href="/support">Support</a>
              </div>
              <div>
                <h4>Legal</h4>
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
                <a href="/contact">Contact Us</a>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>&copy; 2025 FL4SH by 4Sight Education Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
    </>
  )
}

