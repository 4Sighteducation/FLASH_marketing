import type { Metadata } from 'next'

export const SITE_URL = 'https://www.fl4shcards.com'
export const FL4SH_OG_IMAGE_PATH = '/flash_assets/og-share-1200x630.png'

/** Canonical URL with trailing slash (matches next.config.js `trailingSlash: true`). */
export function canonicalUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const withSlash = p.endsWith('/') ? p : `${p}/`
  if (withSlash === '//') return `${SITE_URL}/`
  return `${SITE_URL}${withSlash}`
}

export function buildSeoMetadata(params: {
  title: string
  description: string
  path: string
}): Metadata {
  const canonical = canonicalUrl(params.path)
  const ogImageAbsolute = `${SITE_URL}${FL4SH_OG_IMAGE_PATH}`
  return {
    title: params.title,
    description: params.description,
    alternates: { canonical },
    openGraph: {
      title: params.title,
      description: params.description,
      url: canonical,
      siteName: 'FL4SH',
      type: 'website',
      locale: 'en_GB',
      images: [
        {
          url: FL4SH_OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: 'FL4SH — AI-powered flashcards for GCSE & A-Level',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: params.title,
      description: params.description,
      images: [ogImageAbsolute],
    },
  }
}
