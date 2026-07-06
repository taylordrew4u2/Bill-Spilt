import { getNonce } from "@/lib/nonce";

/**
 * Renders a JSON-LD structured-data <script>, carrying the request's CSP
 * nonce automatically. Centralized so a new page can't forget the nonce —
 * without it, the strict Content-Security-Policy silently drops the script
 * and the page loses its structured data with no visible error.
 */
export async function JsonLd({ data }: { data: object }) {
  const nonce = await getNonce();
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
