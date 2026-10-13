import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Tell next-intl where to load messages from
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'qvgccxrcktcqoghfjgfl.supabase.co' }],
  },
};

export default withNextIntl(nextConfig);