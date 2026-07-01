import Script from "next/script";
import { ADSENSE_CLIENT } from "@/lib/ads-config";

/**
 * Loads the Google AdSense (Auto ads) script. Include this ONLY on public,
 * content-rich pages — the landing page, guides, About and Contact. It is
 * deliberately NOT loaded inside the authenticated app or on the login/empty
 * screens: AdSense policy forbids ad code on "screens without publisher
 * content," and functional tool UI counts as such. Renders nothing when no
 * publisher id is configured (e.g. local/preview).
 */
export function AdSenseScript() {
  if (!ADSENSE_CLIENT) return null;
  return (
    <Script
      id="adsbygoogle-init"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}
