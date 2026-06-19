import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge middleware enforces auth using the edge-safe config (no DB/bcrypt).
export default NextAuth(authConfig).auth;

export const config = {
  // Run on page routes only. All `/api/*` routes are excluded — they enforce
  // their own auth and return JSON 401s (a 307 redirect to /login would break
  // fetch clients and block public endpoints like /api/register). Also skip
  // static assets, the service worker, manifest, and icons.
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|manifest.json|ads.txt|sw.js|workbox-.*|icons/.*|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|js|css|woff2?)$).*)",
  ],
};
