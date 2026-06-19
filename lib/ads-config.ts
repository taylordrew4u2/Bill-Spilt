/**
 * Google AdSense configuration.
 *
 * The publisher id is public (it appears in page source on every AdSense site),
 * so we bake in a default and let an env var override it. Set
 * NEXT_PUBLIC_ADSENSE_CLIENT / _SLOT in the environment to change accounts or
 * point at a specific ad unit without editing code.
 */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-6785541334207915";

/** Optional manual ad-unit slot id. Empty → rely on page-level Auto ads. */
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT || "";
