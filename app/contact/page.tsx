'use client'

import { useState } from 'react'
import Navigation from '../components/Navigation'
import styles from './contact.module.css'
import { useTurnstile } from '../lib/turnstileClient'
import TurnstileFallbackBox from '../components/TurnstileFallbackBox'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [website, setWebsite] = useState('')
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now())
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const { blocked, fallbackVisible, invisibleRef, fallbackRef, getToken, reset } = useTurnstile({
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.TURNSTILE_SITE_KEY,
    action: 'contact_form',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    try {
      const turnstileToken = await getToken()
      if (!turnstileToken) {
        setError(
          blocked
            ? 'Spam protection is blocked on this network. Please email us at admin@4sighteducation.com.'
            : 'Please complete the spam check below, then submit again.'
        )
        return
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, turnstileToken, website, formStartedAt })
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
        setFormData({ name: '', email: '', subject: '', message: '' })
        setWebsite('')
        setFormStartedAt(Date.now())
        reset()
      } else {
        setError(data.error || 'Failed to send message')
      }
    } catch (err) {
      setError('Failed to send message. Please email us directly at admin@4sighteducation.com')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navigation />
      <main className={styles.contactPage}>
        <div className={styles.container}>
          <h1 className={styles.title}>Get in <span className={styles.gradient}>Touch</span></h1>
          <p className={styles.subtitle}>
            Have questions? Want to partner? Just want to say hi? We'd love to hear from you!
          </p>

          {submitted ? (
            <div className={styles.successCard}>
              <div className={styles.successIcon}>✓</div>
              <h2>Message Sent!</h2>
              <p>Thanks for reaching out. We'll get back to you within 24 hours.</p>
              <button 
                onClick={() => {
                  setSubmitted(false)
                  setFormStartedAt(Date.now())
                }}
                className={styles.btnSecondary}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <div className={styles.formContainer}>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }} aria-hidden="true">
                  <label>
                    Website
                    <input
                      type="text"
                      name="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </label>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Tell us what's on your mind..."
                  />
                </div>

                {error && <p className={styles.error}>{error}</p>}
                <TurnstileFallbackBox
                  blocked={blocked}
                  fallbackVisible={fallbackVisible}
                  invisibleRef={invisibleRef}
                  fallbackRef={fallbackRef}
                  mailto="admin@4sighteducation.com"
                  contactLabel="email us"
                />

                <button 
                  type="submit" 
                  className={styles.btnPrimary}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Message →'}
                </button>
              </form>

              <div className={styles.contactInfo}>
                <h3>Other Ways to Reach Us</h3>
                <div className={styles.infoItem}>
                  <span className={styles.icon}>📧</span>
                  <div>
                    <strong>Email</strong>
                    <p><a href="mailto:admin@4sighteducation.com">admin@4sighteducation.com</a></p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.icon}>💬</span>
                  <div>
                    <strong>Support</strong>
                    <p><a href="mailto:support@fl4shcards.com">support@fl4shcards.com</a></p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.icon}>🏢</span>
                  <div>
                    <strong>Company</strong>
                    <p>4Sight Education Ltd</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

