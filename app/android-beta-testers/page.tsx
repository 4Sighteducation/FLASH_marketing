'use client'

import { useState } from 'react'
import Navigation from '../components/Navigation'
import styles from './android-beta-testers.module.css'

export default function AndroidBetaTestersPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'android_beta' }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.')
        return
      }

      setSubmitted(true)
      setEmail('')
    } catch {
      setError('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navigation />
      <main className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>
            Android <span className={styles.gradient}>BETA Testers</span>
          </h1>
          <p className={styles.subtitle}>
            Google requires a closed test before we can publish FL4SH to the Play Store. If you have an Android phone,
            opt in to our beta and help us ship.
          </p>

          <div className={styles.grid}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>What you’ll do</h2>
              <ul className={styles.list}>
                <li>✅ Opt in to the closed test</li>
                <li>✅ Install the beta from Google Play</li>
                <li>✅ Open the app at least once</li>
                <li>✅ (Optional) Send feedback / screenshots when something breaks</li>
              </ul>
              <p className={styles.note}>
                You don’t need to “test every day” — staying opted-in helps us meet Google’s criteria.
              </p>
            </section>

            <aside className={`${styles.card} ${styles.cardPink}`}>
              <h2 className={styles.cardTitle}>Reward</h2>
              <p className={styles.note}>
                🎁 <strong>Get Pro for 1 year</strong> as a thank‑you for joining the Android beta.
              </p>

              {submitted ? (
                <div className={styles.success}>
                  🎉 You’re on the list. We’ll email you the opt‑in link + setup steps soon.
                </div>
              ) : (
                <form className={styles.form} onSubmit={handleSubmit}>
                  <div>
                    <label className={styles.label} htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      className={styles.input}
                      type="email"
                      required
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  {error && <div className={styles.error}>{error}</div>}

                  <button className={styles.btnPrimary} type="submit" disabled={loading}>
                    {loading ? 'Joining…' : 'Join Android Beta →'}
                  </button>

                  <div className={styles.finePrint}>
                    By joining, you agree to receive beta emails from us. Questions?{' '}
                    <a href="/contact">Contact us</a>.
                  </div>
                </form>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}






