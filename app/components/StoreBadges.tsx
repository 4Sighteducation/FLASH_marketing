import styles from './StoreBadges.module.css'

export default function StoreBadges(props: { note?: string }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <a className={styles.badgeLink} href="/download" aria-label="Download on the App Store (opens details)">
          <img
            className={styles.badge}
            src="/flash_assets/store/app-store-badge.svg"
            alt="Download on the App Store"
            width={180}
            height={60}
            loading="lazy"
          />
        </a>
        <a className={styles.badgeLink} href="/download" aria-label="Get it on Google Play (opens details)">
          <img
            className={styles.badge}
            src="/flash_assets/store/google-play-badge.svg"
            alt="Get it on Google Play"
            width={180}
            height={60}
            loading="lazy"
          />
        </a>
      </div>
      <div className={styles.note}>{props.note ?? 'Launching February 2026 (apps not live yet)'}</div>
    </div>
  )
}

