import styles from './StoreBadges.module.css'

const APP_STORE_URL = 'https://apps.apple.com/in/app/fl4sh-study-smarter/id6747457678'
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.foursighteducation.flash'

export default function StoreBadges(props: { note?: string; showNote?: boolean }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <a 
          className={styles.badgeLink} 
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer" 
          aria-label="Download on the App Store"
        >
          <img
            className={styles.badge}
            src="/flash_assets/store/app-store-badge.svg"
            alt="Download on the App Store"
            width={180}
            height={60}
            loading="lazy"
          />
        </a>
        <a 
          className={styles.badgeLink} 
          href={GOOGLE_PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Get it on Google Play"
        >
          <img
            className={styles.badge}
            src="/flash_assets/store/google-play-badge.png"
            alt="Get it on Google Play"
            width={155}
            height={60}
            loading="lazy"
          />
        </a>
      </div>
      {props.showNote !== false && (
        <div className={styles.note}>{props.note ?? 'Available now on iOS and Android'}</div>
      )}
    </div>
  )
}

