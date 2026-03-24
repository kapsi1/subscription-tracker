import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/manage', '/settings', '/subscriptions'],
    },
    sitemap: 'https://subtracker.cc/sitemap.xml',
  };
}
