import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig, isAuthRoute, isPublicRoute } from "@/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * Build a strict, nonce-based Content-Security-Policy.
 *
 * Google only supports *strict* CSP for the AdSense ad code, because the domains
 * the ads load from rotate over time and any static allowlist would eventually
 * break. With a per-request nonce plus `'strict-dynamic'`, only our own nonce'd
 * scripts run, and scripts they load (the AdSense loader → ad creatives) are
 * trusted transitively — no domain list to maintain.
 *
 * `'unsafe-inline'`, `'unsafe-eval'`, and `https:`/`http:` in script-src are
 * fallbacks that browsers supporting `'strict-dynamic'` deliberately ignore;
 * they keep older browsers working. This mirrors Google's recommended policy.
 */
function buildCsp(nonce: string): string {
  const directives = [
    "default-src 'self'",
    `script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:`,
    // Next.js and Tailwind inject <style> tags; ad creatives add inline styles.
    "style-src 'self' 'unsafe-inline' https:",
    // Ads, avatars, and receipt uploads pull images from many hosts.
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    // App calls its own /api; ads beacon to Google's ad servers over https.
    "connect-src 'self' https:",
    // Ad creatives render inside iframes served from Google's ad domains.
    "frame-src 'self' https:",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];
  // Optional violation reporting — set CSP_REPORT_URI to a collector endpoint.
  const reportUri = process.env.CSP_REPORT_URI;
  if (reportUri) directives.push(`report-uri ${reportUri}`);
  return directives.join("; ");
}

/** A random base64 nonce, generated with the Edge-available Web Crypto API. */
function makeNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * Edge middleware. Two jobs:
 *  1. Enforce auth (via the edge-safe config's route rules).
 *  2. Attach a strict, nonce-based CSP to every page response and forward the
 *     nonce to the app on the `x-nonce` request header so our scripts can adopt
 *     it. Setting the CSP on the *request* headers too lets Next.js apply the
 *     nonce to its own framework scripts automatically.
 */
export default auth((req) => {
  const nonce = makeNonce();
  const csp = buildCsp(nonce);
  const p = req.nextUrl.pathname;
  const isLoggedIn = !!req.auth?.user;

  // Authorization, mirroring authConfig.authorized (which the callback form of
  // `auth()` bypasses, so we replicate it here).
  if (isAuthRoute(p) && isLoggedIn) {
    const res = NextResponse.redirect(new URL("/home", req.nextUrl));
    res.headers.set("Content-Security-Policy", csp);
    return res;
  }
  if (!isAuthRoute(p) && !isPublicRoute(p) && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", p);
    const res = NextResponse.redirect(url);
    res.headers.set("Content-Security-Policy", csp);
    return res;
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
});

export const config = {
  // Run on page routes only. All `/api/*` routes are excluded — they enforce
  // their own auth and return JSON 401s (a 307 redirect to /login would break
  // fetch clients and block public endpoints like /api/register). Also skip
  // static assets, the service worker, manifest, icons, and the generated
  // SEO/social-image routes (which crawlers must reach without auth).
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|manifest.json|ads.txt|robots.txt|sitemap.xml|opengraph-image|twitter-image|sw.js|workbox-.*|icons/.*|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|js|css|woff2?|html|txt|xml)$).*)",
  ],
};
