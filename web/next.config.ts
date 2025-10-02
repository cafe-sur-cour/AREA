import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['frontend.nduboi.fr:16836', 'frontend.nduboi.fr', 'localhost:3000'],
    },
  },
};

export default nextConfig;
