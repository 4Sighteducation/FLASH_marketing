/**
 * Cross-linking footer credit (SEO): 4Sight Education + 4site.dev
 */
export default function SiteCreditFooter() {
  return (
    <footer aria-label="Site credits">
      <p
        style={{
          fontSize: 12,
          color: '#666',
          marginTop: '1rem',
          textAlign: 'center',
          padding: '0 1rem 1.5rem',
        }}
      >
        Built by{' '}
        <a
          href="https://www.4sighteducation.com"
          target="_blank"
          rel="noopener"
          style={{ color: '#888', textDecoration: 'none' }}
        >
          4Sight Education
        </a>
        {' · '}
        Web development by{' '}
        <a
          href="https://4site.dev"
          target="_blank"
          rel="noopener"
          style={{ color: '#888', textDecoration: 'none' }}
        >
          4site.dev
        </a>
      </p>
    </footer>
  )
}
