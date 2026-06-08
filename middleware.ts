import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge middleware enforces auth using the edge-safe config (no DB/bcrypt).
export default NextAuth(authConfig).auth;

export const config = {
  // Run on all routes except static assets, the service worker, manifest,
  // icons, and the NextAuth API routes.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|icons/.*|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|js|css|woff2?)$).*)",
  ],
};
