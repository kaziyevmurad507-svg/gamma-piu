import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Tell next-intl where to load messages from
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const localTests = process.env.SUPABASE_LOCAL_TESTS === '1' && process.env.VERCEL_ENV !== 'production' && process.env.APP_ENV !== 'production';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
      ...(process.env.VERCEL_ENV === 'preview' || process.env.APP_ENV === 'preview'
        ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),
    ] }];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'qvgccxrcktcqoghfjgfl.supabase.co' },
      ...(localTests ? [{ protocol: 'http' as const, hostname: '127.0.0.1', port: '54321', pathname: '/storage/v1/object/public/product-images/**' }] : []),
    ],
    // The CI database is isolated on the runner; production never enables local IP image fetches.
    ...(localTests ? { dangerouslyAllowLocalIP: true } : {}),
  },
};

export default withNextIntl(nextConfig);
