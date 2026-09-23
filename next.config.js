const { withFaust, getWpHostname } = require('@faustwp/core');

module.exports = withFaust({
  reactStrictMode: true,
  sassOptions: {
    includePaths: ['node_modules'],
  },
  images: {
    domains: [
      getWpHostname(),
      'cms.grad.calpoly.edu',
    ],
    // Prefer modern formats where supported
    formats: ['image/avif', 'image/webp'],

    // Keep the default Next widths available so older markup and cached pages
    // do not request optimizer widths that the server rejects.
    deviceSizes: [360, 480, 640, 750, 768, 828, 1024, 1080, 1200, 1280, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 160, 240, 256, 320, 340, 384, 420],

    // Long-lived cache for optimized images
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'bpgrad.wpenginepowered.com',
          },
        ],
        destination: 'https://grad.calpoly.edu/:path*',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
});
