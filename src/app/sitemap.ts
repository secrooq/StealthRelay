import { MetadataRoute } from 'next';

export const runtime = 'edge';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://stealthrelay.com';
  
  const routes = [
    '',
    '/pricing',
    '/features',
    '/compare',
    '/industries',
    '/products/relay',
    '/products/vault',
    '/products/share',
    '/blog',
    '/roadmap',
    '/accessibility',
    '/disclaimer',
    '/legal',
    '/legal/refund',
    '/legal/cookie',
  ];

  const blogSlugs = [
    'quantum-threat-identity',
    'zero-trust-metadata',
    'establishing-stealth-vault',
    'hardening-comm-vectors',
    'anatomy-digital-burn',
    'anti-phishing-authentication',
    'secure-exif-stripping-ram',
    'hybrid-homomorphic-encryption',
  ];

  const staticSitemap = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const blogSitemap = blogSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticSitemap, ...blogSitemap];
}
