// frontend/next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const apiBase = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000').replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    console.log(`[Next.js Proxy] Rewriting API calls to: ${apiBase}`);
    return [
      // --- Aturan Spesifik DULU ---
      // Aturan KHUSUS untuk endpoint signin agar tidak bentrok dengan halaman /auth/signin
      {
        source: '/api/auth/signin', // Path yang dipanggil frontend
        destination: `${apiBase}/auth/signin` // Path tujuan di backend
      },
      // ++ ATURAN BARU UNTUK VERIFIKASI ++
      {
        source: '/api/auth/verify', // Path yang dipanggil frontend verify page
        destination: `${apiBase}/auth/verify` // Path tujuan di backend
      },
      // --- Aturan lupa password ---
      {
        source: '/api/auth/forgot',
        destination: `${apiBase}/auth/forgot` // Mengarah ke backend /auth/forgot
      },
      {
        source: '/api/auth/reset-password',
        destination: `${apiBase}/auth/reset-password` // Mengarah ke backend /auth/reset-password
      },
      {
        source: '/api/auth/verify-token/:token',
        destination: `${apiBase}/auth/verify-token/:token` 
      },
      
      // --- Aturan Umum /api SETELAHNYA ---
      {
        source: '/api/:path*', // Menangkap semua /api/* lainnya
        destination: `${apiBase}/api/:path*`
      },
      // --- Aturan /auth/* lainnya (yang tidak bentrok dengan halaman frontend) ---
      {
        source: '/auth/me',
        destination: `${apiBase}/auth/me`
      },
      {
        source: '/auth/signup', // Endpoint signup API (dipanggil oleh frontend signup form)
        destination: `${apiBase}/auth/signup`
      },
      {
        source: '/auth/signout',
        destination: `${apiBase}/auth/signout`
      },
      {
        source: '/auth/google/:path*', // Untuk /auth/google (redirect) dan /auth/google/callback
        destination: `${apiBase}/auth/google/:path*`
      },
      // Tambahkan aturan /auth/* lain di sini jika ada dan TIDAK bentrok dengan halaman frontend
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export default withNextIntl(nextConfig);