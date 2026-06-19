import withSerwistInit from "@serwist/next";

// Serwist replaces next-pwa (which doesn't support Next.js 15/16). It compiles
// the service worker from app/sw.ts and injects the precache manifest.
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },
};

export default withSerwist(nextConfig);
