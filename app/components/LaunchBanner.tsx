'use client'

import styles from './LaunchBanner.module.css'

const APP_STORE_URL = 'https://apps.apple.com/in/app/fl4sh-study-smarter/id6747457678'
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.foursighteducation.flash'

export default function LaunchBanner() {
  return (
    <div className={styles.banner}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.message}>
            <span className={styles.badge}>🎉 NOW AVAILABLE</span>
            <p>
              FL4SH is <strong className={styles.highlight}>LIVE</strong> on iOS and Android! 
              {' '}<strong className={styles.highlight}>Get Pro free for 30 days</strong> — no credit card required.
            </p>
          </div>
          
          <div className={styles.buttonGroup}>
            <a 
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.downloadButton}
            >
              📱 Download iOS App →
            </a>
            <a 
              href={GOOGLE_PLAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.downloadButton}
            >
              🤖 Download Android App →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
