import createNextIntlPlugin from 'next-intl/plugin';
import { getSecurityHeaders } from './src/server/security/security-headers';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: getSecurityHeaders(process.env.NODE_ENV === 'development'),
    }];
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
