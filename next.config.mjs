/**
 * React's development build needs `eval()` — it reconstructs callstacks and
 * powers other debugging features with it — so a CSP without `unsafe-eval`
 * makes it log an error on every page in `next dev`.
 *
 * It is granted in development only. React never uses `eval()` in production,
 * so the shipped policy stays strict; loosening it there to quiet a dev-only
 * console message would trade real security for convenience.
 */
const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self)',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self'",
          "connect-src 'self'",
          // The offline service worker is same-origin (`/sw.js`); stated
          // explicitly rather than left to fall back through script-src.
          "worker-src 'self'",
          "manifest-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
        ].join('; '),
      },
    ];
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
