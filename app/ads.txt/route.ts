import { ADSENSE_CLIENT } from "@/lib/ads-config";

export const runtime = "nodejs";
export const dynamic = "force-static";

/**
 * Serves /ads.txt for Google AdSense, derived from the publisher id. AdSense
 * checks this file at the domain root to authorize your account to sell ads on
 * this site.
 */
export async function GET() {
  const headers = { "content-type": "text/plain; charset=utf-8" };
  if (!ADSENSE_CLIENT) return new Response("", { status: 200, headers });

  const pub = ADSENSE_CLIENT.replace(/^ca-/, ""); // ca-pub-… → pub-…
  const body = `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, { status: 200, headers });
}
