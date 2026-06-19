/**
 * Site-admin (app operator) identification — distinct from a household "owner".
 * Site admins manage advertisements and other app-wide settings.
 *
 * Configure via the SITE_ADMIN_EMAILS env var (comma-separated). If unset, it
 * falls back to the built-in operator email so the feature works out of the box
 * on the operator's own deployment. Change FALLBACK_ADMINS or set the env var
 * to hand monetization control to a different account.
 */
const FALLBACK_ADMINS = ["taylordrew4u@gmail.com"];

export function siteAdminEmails(): string[] {
  const env = process.env.SITE_ADMIN_EMAILS;
  const list = env
    ? env.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : FALLBACK_ADMINS;
  return list.map((e) => e.toLowerCase());
}

export function isSiteAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return siteAdminEmails().includes(email.toLowerCase());
}
