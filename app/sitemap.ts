import { MetadataRoute } from 'next'

// Must match next.config.js `trailingSlash: true` and your primary host (www).
const base = 'https://www.fl4shcards.com'

function absUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const withSlash = p.endsWith('/') ? p : `${p}/`
  return `${base}${withSlash === '//' ? '/' : withSlash}`
}

type Entry = {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}

const ENTRIES: Entry[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/download', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/gcse-flashcards', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/a-level-flashcards', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/exam-boards/aqa', changeFrequency: 'weekly', priority: 0.75 },
  { path: '/exam-boards/edexcel', changeFrequency: 'weekly', priority: 0.75 },
  { path: '/exam-boards/ocr', changeFrequency: 'weekly', priority: 0.75 },
  { path: '/subjects/mathematics', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/subjects/sciences', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/subjects/english', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/subjects/history', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/subjects/humanities', changeFrequency: 'weekly', priority: 0.65 },
  { path: '/subjects/psychology', changeFrequency: 'weekly', priority: 0.65 },
  { path: '/subjects/languages', changeFrequency: 'weekly', priority: 0.65 },
  { path: '/subjects/business-and-it', changeFrequency: 'weekly', priority: 0.65 },
  { path: '/subjects/physical-education', changeFrequency: 'weekly', priority: 0.65 },
  { path: '/vocational', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/vocational/cambridge-nationals', changeFrequency: 'weekly', priority: 0.55 },
  { path: '/vocational/btec-nationals', changeFrequency: 'weekly', priority: 0.55 },
  { path: '/scotland', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/scotland/highers', changeFrequency: 'weekly', priority: 0.55 },
  { path: '/scotland/nationals', changeFrequency: 'weekly', priority: 0.55 },
  { path: '/international', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/international/igcse', changeFrequency: 'weekly', priority: 0.55 },
  { path: '/international/international-a-level', changeFrequency: 'weekly', priority: 0.55 },
  { path: '/schools', changeFrequency: 'weekly', priority: 0.65 },
  { path: '/parents', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/support', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/privacy', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'monthly', priority: 0.3 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return ENTRIES.map((e) => ({
    url: absUrl(e.path),
    lastModified: new Date(),
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }))
}
