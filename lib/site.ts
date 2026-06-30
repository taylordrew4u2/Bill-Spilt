/**
 * Canonical site metadata, shared by the layout, landing page, robots, and
 * sitemap so SEO data stays consistent and DRY.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://billspilt.com";

export const SITE_NAME = "BillSpilt";

export const SITE_TAGLINE = "Free bill splitter for roommates";

export const SITE_DESCRIPTION =
  "BillSpilt is a free roommate bill splitter: split shared bills, track who owes what, and settle up with the fewest payments. No paywall, no premium tier, no credit card — split rent, utilities, groceries and more. Works offline, installs to your home screen.";

/**
 * Search terms real people use to find an app like this. Kept focused — these
 * mirror the headings and copy on the landing page so the page actually earns
 * the relevance, rather than keyword-stuffing.
 */
export const SITE_KEYWORDS = [
  "split bills with roommates",
  "bill splitting app",
  "free bill splitter",
  "split expenses app",
  "roommate expense tracker",
  "shared expenses app",
  "split rent and utilities",
  "who owes what app",
  "settle up app",
  "split costs with friends",
  "IOU tracker",
  "roommate bill splitter",
  "split grocery bills",
  "free Splitwise alternative",
  "household expense tracker",
];
