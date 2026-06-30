import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { CookieConsent } from "@/components/cookie-consent";
import { ADSENSE_CLIENT } from "@/lib/ads-config";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
} from "@/lib/site";

const APP_NAME = SITE_NAME;
const DEFAULT_TITLE = "BillSpilt — Free bill splitter for roommates";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: APP_NAME,
  title: {
    default: DEFAULT_TITLE,
    template: "%s · BillSpilt",
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  category: "finance",
  manifest: "/manifest.json",
  alternates: { canonical: "/" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    url: SITE_URL,
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Search-engine ownership verification. Set each token from the respective
  // webmaster console; any unset one is simply omitted.
  //  - NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION → Google Search Console
  //  - NEXT_PUBLIC_BING_SITE_VERIFICATION   → Bing Webmaster Tools (also DuckDuckGo)
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : {},
  },
  // AdSense account verification.
  other: { "google-adsense-account": ADSENSE_CLIENT },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved/system theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
        {/* AdSense site verification (meta tag). The ad *script* loads only on
            authenticated content pages — see components/app-shell.tsx — so ads
            never appear on the login/empty screens (AdSense inventory policy). */}
      </head>
      <body className="min-h-[100dvh] antialiased">
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
    </html>
  );
}
