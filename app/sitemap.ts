import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.fl4shcards.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://www.fl4shcards.com/download',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.fl4shcards.com/gcse-flashcards',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.fl4shcards.com/a-level-flashcards',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.fl4shcards.com/exam-boards/aqa',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: 'https://www.fl4shcards.com/exam-boards/edexcel',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: 'https://www.fl4shcards.com/exam-boards/ocr',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: 'https://www.fl4shcards.com/subjects/mathematics',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://www.fl4shcards.com/subjects/sciences',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://www.fl4shcards.com/subjects/english',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://www.fl4shcards.com/subjects/history',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://www.fl4shcards.com/subjects/humanities',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.65,
    },
    {
      url: 'https://www.fl4shcards.com/subjects/psychology',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.65,
    },
    {
      url: 'https://www.fl4shcards.com/subjects/languages',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.65,
    },
    {
      url: 'https://www.fl4shcards.com/subjects/business-and-it',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.65,
    },
    {
      url: 'https://www.fl4shcards.com/subjects/physical-education',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.65,
    },
    {
      url: 'https://www.fl4shcards.com/vocational',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://www.fl4shcards.com/vocational/cambridge-nationals',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.55,
    },
    {
      url: 'https://www.fl4shcards.com/vocational/btec-nationals',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.55,
    },
    {
      url: 'https://www.fl4shcards.com/scotland',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://www.fl4shcards.com/scotland/highers',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.55,
    },
    {
      url: 'https://www.fl4shcards.com/scotland/nationals',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.55,
    },
    {
      url: 'https://www.fl4shcards.com/international',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://www.fl4shcards.com/international/igcse',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.55,
    },
    {
      url: 'https://www.fl4shcards.com/international/international-a-level',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.55,
    },
    {
      url: 'https://www.fl4shcards.com/schools',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.65,
    },
    {
      url: 'https://www.fl4shcards.com/parents',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://www.fl4shcards.com/support',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://www.fl4shcards.com/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: 'https://www.fl4shcards.com/privacy',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: 'https://www.fl4shcards.com/terms',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]
}

