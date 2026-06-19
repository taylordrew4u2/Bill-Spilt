export const runtime = "nodejs";
export const dynamic = "force-static";

/**
 * Serves /ads.txt for Google AdSense, derived from the publisher id. AdSense
 * checks this file at the domain root to authorize your account to sell ads on
 * this site. Returns empty (still 200) when AdSense isn't configured.
 */
export async function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT; // e.g. ca-pub-123…
  const headers = { "content-type": "text/plain; charset=utf-8" };
  if (!client) return new Response("", { status: 200, headers });

  const pub = client.replace(/^ca-/, ""); // pub-123…
  const body = `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, { status: 200, headers });
}
