'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './AndroidBetaPopup.module.css'

type Props = {
  href?: string
}

const SESSION_KEY = 'android_beta_popup_dismissed_v1'

export default function AndroidBetaPopup({ href = '/android-beta-testers' }: Props) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const dismissed = sessionStorage.getItem(SESSION_KEY) === 'true'
      if (!dismissed) {
        // Small delay so the page doesn't feel "jumpy" on load
        const t = window.setTimeout(() => setOpen(true), 900)
        return () => window.clearTimeout(t)
      }
    } catch {
      // ignore
    }
  }, [])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!mounted) return
    if (!open) return

    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    return () => {
      const top = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, parseInt(top || '0') * -1)
    }
  }, [open, mounted])

  const dismiss = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, 'true')
    } catch {
      // ignore
    }
    setOpen(false)
  }

  if (!mounted || !open) return null

  const modal = (
    <div className={styles.modal} onClick={dismiss} role="dialog" aria-modal="true" aria-label="Android beta testers">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={dismiss} aria-label="Close">
          ×
        </button>

        <div className={styles.kicker}>Android beta</div>
        <h2 className={styles.title}>Android Beta Testers Wanted</h2>
        <p className={styles.subtitle}>
          Help us ship FL4SH on Google Play. Opt in to our closed test and you’ll get early access + a thank‑you reward.
        </p>

        <div className={styles.offerCard}>
          <p className={styles.offerLine}>
            🎁 <strong>Get Pro for 1 year</strong>
          </p>
          <p className={styles.small}>Limited time incentive for Android testers who opt in and install the beta.</p>
        </div>

        <div className={styles.actions}>
          <a className={styles.primaryBtn} href={href} onClick={dismiss}>
            Join Android Beta →
          </a>
          <button className={styles.secondaryBtn} onClick={dismiss}>
            Not now
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}






