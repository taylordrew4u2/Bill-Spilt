import { headers } from "next/headers";

/**
 * Reads the per-request CSP nonce that the middleware (proxy.ts) sets on the
 * `x-nonce` request header. Every inline <script> we render — the theme script,
 * JSON-LD, the AdSense loader — must carry this nonce, or the strict
 * Content-Security-Policy will block it. Reading a header opts the caller into
 * dynamic rendering, which strict CSP requires anyway (each response needs a
 * fresh nonce).
 */
export async function getNonce(): Promise<string | undefined> {
  const nonce = (await headers()).get("x-nonce");
  return nonce ?? undefined;
}
