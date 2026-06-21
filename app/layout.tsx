import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { CookieConsent } from "@/components/cookie-consent";
import { ADSENSE_CLIENT } from "@/lib/ads-config";

const APP_NAME = "BILL SPILT";
const APP_DESCRIPTION =
  "Bill splitting for roommates. Split shared bills, see who owes what instantly, and settle up with the fewest payments. Free forever.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: "BILL SPILT — Bill splitting for roommates",
    template: "%s · BILL SPILT",
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
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
