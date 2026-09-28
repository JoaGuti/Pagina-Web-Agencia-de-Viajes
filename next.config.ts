import type { NextConfig } from 'next';

// Las fotos (paquetes, ofertas, logo, Data Fiscal) vienen del almacenamiento de Kuro (Supabase Storage).
const kuroOrigen = (() => {
  try {
    return process.env.KURO_API_URL ? ' ' + new URL(process.env.KURO_API_URL).origin : '';
  } catch {
    return '';
  }
})();

const csp = [
  "default-src 'self'",
  "script-src 'self' https://www.googletagmanager.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://*.google-analytics.com https://www.googletagmanager.com${kuroOrigen}`,
  "media-src 'self' https://*.public.blob.vercel-storage.com",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const seguridad = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
];

const config: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: seguridad },
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }] },
      { source: '/media/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/vendor/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ];
  },
  // La web se administra desde el panel Kuro: /panel y /admin llevan ahí.
  async redirects() {
    const panel = process.env.KURO_PANEL_URL || 'https://panel.kuroautomation.com';
    return [
      { source: '/panel', destination: panel, permanent: false },
      { source: '/panel/:path*', destination: panel, permanent: false },
      { source: '/admin', destination: panel, permanent: false },
    ];
  },
};

export default config;
