import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['frontend.nduboi.fr:16836', 'frontend.nduboi.fr'],
    },
  },
};

export default withNextIntl(nextConfig);
