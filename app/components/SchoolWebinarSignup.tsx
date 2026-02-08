'use client'

import Image from 'next/image'
import { useState } from 'react'
import styles from './SchoolWebinarSignup.module.css'
import { useTurnstile } from '../lib/turnstileClient'
import TurnstileFallbackBox from './TurnstileFallbackBox'

type FormState = {
  name: string
  email: string
  role: string
  establishment: string
}

export default function SchoolWebinarSignup() {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    role: '',
    establishment: '',
  })
  const [website, setWebsite] = useState('')
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now())
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const { blocked, fallbackVisible, invisibleRef, fallbackRef, getToken, reset } = useTurnstile({
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.TURNSTILE_SITE_KEY,
    action: 'schools_webinar',
  })

  const onChange =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [key]: e.target.value }))
    }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setOk(null)
    setErr(null)

    try {
      const turnstileToken = await getToken()
      if (!turnstileToken) {
        if (blocked) setErr('Spam protection is blocked on this network. Please email us at support@fl4shcards.com.')
        return
      }

      const res = await fetch('/api/schools/webinar-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, turnstileToken, website, formStartedAt }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Something went wrong')

      setOk(
        json?.alreadySignedUp
          ? 'You’re already registered — we’ve re-sent the booking link (if needed).'
          : 'You’re registered — check your inbox for the booking link.'
      )
      setForm({ name: '', email: '', role: '', establishment: '' })
      setWebsite('')
      setFormStartedAt(Date.now())
      reset()
    } catch (e: any) {
      setErr(String(e?.message || 'Failed to submit. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <span className={styles.badge}>Free school webinar • usually £350</span>
            <h2 className={styles.title}>Supercharged Revision (60 minutes)</h2>
            <p className={styles.subtitle}>
              Register your interest in FL4SH and we’ll email you the booking link for a free student
              revision webinar delivered by VESPA Academy.
            </p>
          </div>

          <a href="https://www.vespa.academy/" target="_blank" rel="noreferrer">
            <Image
              src="/vespa-academy-logo.png"
              alt="VESPA Academy"
              width={180}
              height={180}
              style={{ height: 'auto', width: 180, opacity: 0.95 }}
            />
          </a>
        </div>

        <form onSubmit={onSubmit}>
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
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="school-name">
                Your name *
              </label>
              <input
                id="school-name"
                className={styles.input}
                value={form.name}
                onChange={onChange('name')}
                required
                disabled={loading}
                placeholder="e.g., Sarah Johnson"
                autoComplete="name"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="school-email">
                Work email *
              </label>
              <input
                id="school-email"
                className={styles.input}
                value={form.email}
                onChange={onChange('email')}
                required
                disabled={loading}
                placeholder="e.g., s.johnson@school.sch.uk"
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="school-role">
                Role (optional)
              </label>
              <input
                id="school-role"
                className={styles.input}
                value={form.role}
                onChange={onChange('role')}
                disabled={loading}
                placeholder="e.g., Head of Year / Science Teacher"
                autoComplete="organization-title"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="school-establishment">
                Establishment (optional)
              </label>
              <input
                id="school-establishment"
                className={styles.input}
                value={form.establishment}
                onChange={onChange('establishment')}
                disabled={loading}
                placeholder="e.g., King’s College School"
                autoComplete="organization"
              />
            </div>
          </div>

          <div className={styles.actions}>
            <TurnstileFallbackBox
              blocked={blocked}
              fallbackVisible={fallbackVisible}
              invisibleRef={invisibleRef}
              fallbackRef={fallbackRef}
              mailto="support@fl4shcards.com"
              contactLabel="email us"
              contextLabel="spam protection"
            />
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? 'Registering…' : 'Get the free webinar booking link →'}
            </button>
          </div>

          <p className={styles.finePrint}>
            By signing up, you agree to receive FL4SH launch notifications. We’ll only email school-relevant
            updates and the webinar booking details.
          </p>

          {ok && <div className={styles.statusOk}>{ok}</div>}
          {err && <div className={styles.statusErr}>{err}</div>}
        </form>
      </div>
    </div>
  )
}

