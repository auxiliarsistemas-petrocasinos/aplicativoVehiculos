import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone',
  agentRules: false,
  devIndicators: false,
  poweredByHeader: false,
  allowedDevOrigins: ['127.0.0.1'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'geolocation=()' },
        ],
      },
    ];
  },
};
export default config;
