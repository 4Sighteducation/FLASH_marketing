import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './SeoPage.module.css'

type Breadcrumb = { label: string; href: string }

export type SeoPageProps = {
  title: string
  description: string
  breadcrumbs?: Breadcrumb[]
  children: React.ReactNode
  links?: Array<{ label: string; href: string }>
}

export function SeoCard(props: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.card}>
      <h2>{props.title}</h2>
      {props.children}
    </section>
  )
}

export function buildSeoMetadata(params: {
  title: string
  description: string
  path: string
}): Metadata {
  const url = `https://fl4shcards.com${params.path.startsWith('/') ? params.path : `/${params.path}`}`
  return {
    title: params.title,
    description: params.description,
    alternates: { canonical: url },
    openGraph: { title: params.title, description: params.description, url },
  }
}

export default function SeoPage(props: SeoPageProps) {
  const breadcrumbs = props.breadcrumbs ?? [{ label: 'Home', href: '/' }]

  return (
    <main className={styles.wrap}>
      <div className={styles.container}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          {breadcrumbs.map((b, idx) => (
            <span key={`${b.href}-${idx}`}>
              {idx > 0 ? ' / ' : null}
              <Link href={b.href}>{b.label}</Link>
            </span>
          ))}
        </nav>

        <h1 className={styles.title}>{props.title}</h1>
        <p className={styles.subtitle}>{props.description}</p>

        {props.links?.length ? (
          <div className={styles.links}>
            {props.links.map((l) => (
              <a key={l.href} className={styles.link} href={l.href}>
                {l.label} →
              </a>
            ))}
          </div>
        ) : null}

        <div className={styles.content}>{props.children}</div>
      </div>
    </main>
  )
}

