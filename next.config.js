/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  runtimeCaching: [
    {
      // App shell + static assets: cache-first
      urlPattern: /^https?.*\.(?:js|css|woff2?|png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      // Next.js data + pages: stale-while-revalidate
      urlPattern: /\/_next\/.*/i,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "next-static" },
    },
    {
      // API routes: network-first so data stays fresh, falls back to cache offline
      urlPattern: /\/api\/.*$/i,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
    {
      // HTML documents: network-first for fresh app shell
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: { cacheName: "pages", networkTimeoutSeconds: 10 },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },
};

module.exports = withPWA(nextConfig);
