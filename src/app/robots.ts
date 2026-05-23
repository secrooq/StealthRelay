import { MetadataRoute } from 'next';

export const runtime = 'edge';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/vault/', '/relay/', '/settings/'],
    },
    sitemap: 'https://stealthrelay.com/sitemap.xml',
  };
}
