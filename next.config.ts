import type { NextConfig } from "next";

if (process.env.NODE_ENV === 'development') {
  const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev');
  setupDevPlatform();
}

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: '50mb',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com *.clerk.com *.clerk.accounts.dev; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://challenges.cloudflare.com *.stripe.com *.clerk.com *.clerk.accounts.dev; connect-src 'self' *.clerk.com *.clerk.accounts.dev *.stripe.com https://challenges.cloudflare.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
