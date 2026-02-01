'use client'

import styles from './DownloadButton.module.css'

const APP_STORE_URL = 'https://apps.apple.com/in/app/fl4sh-study-smarter/id6747457678'
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.foursighteducation.flash'

interface Props {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
  preferredStore?: 'ios' | 'android' | 'both'
}

export default function DownloadButton({ 
  children, 
  variant = 'primary', 
  className = '',
  preferredStore = 'both'
}: Props) {
  
  // If single store preference, link directly
  if (preferredStore === 'ios') {
    return (
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} ${styles.btn} ${variant === 'primary' ? styles.btnPrimary : styles.btnSecondary}`}
      >
        {children}
      </a>
    )
  }
  
  if (preferredStore === 'android') {
    return (
      <a
        href={GOOGLE_PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} ${styles.btn} ${variant === 'primary' ? styles.btnPrimary : styles.btnSecondary}`}
      >
        {children}
      </a>
    )
  }
  
  // For 'both', scroll to store badges
  return (
    <a
      href="#download-apps"
      className={`${className} ${styles.btn} ${variant === 'primary' ? styles.btnPrimary : styles.btnSecondary}`}
    >
      {children}
    </a>
  )
}
