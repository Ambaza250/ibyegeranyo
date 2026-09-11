import type { MetadataRoute } from 'next';
import { getAllDocumentaries } from '@/lib/db';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://ibyegeranyo.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/documentaries`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  let documentaryPages: MetadataRoute.Sitemap = [];

  try {
    const docs = await getAllDocumentaries();
    documentaryPages = docs
      .filter((d) => d.status === 'published' || !d.status)
      .map((d) => ({
        url: `${siteUrl}/documentaries/${d.id}`,
        lastModified: d.updatedAt ? new Date(d.updatedAt) : new Date(d.createdAt || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
  } catch {
    // If DB is unavailable at build time, still ship static URLs
  }

  return [...staticPages, ...documentaryPages];
}
