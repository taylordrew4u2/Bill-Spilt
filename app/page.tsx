import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";
import { ADSENSE_CLIENT } from "@/lib/ads-config";
import {
  Receipt,
  Scale,
  Users,
  CreditCard,
  Repeat,
  Camera,
  WifiOff,
  Bell,
  Crown,
  ArrowRight,
} from "lucide-react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { Brand } from "@/components/brand";
import { CATEGORIES } from "@/lib/types";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_KEYWORDS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free Bill Splitter for Roommates — Split Bills & Settle Up | BILL SPILT",
  description:
    "Split bills with your roommates for free. BILL SPILT tracks shared expenses, shows who owes what instantly, and settles up in the fewest payments — no paywall, no credit card. Split rent, utilities & groceries. Works offline.",
  keywords: SITE_KEYWORDS,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Free Bill Splitter for Roommates — BILL SPILT",
    description:
      "Split shared bills with roommates, see who owes what, and settle up in the fewest payments. Free forever — no paywall, no credit card.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Bill Splitter for Roommates — BILL SPILT",
    description:
      "Split shared bills, see who owes what, settle up in the fewest payments. Free forever.",
  },
};

const STEPS = [
  {
    icon: Receipt,
    title: "1. Log an expense",
    body: "Add what you paid in seconds — pick a category, the amount, and how to split it (evenly, exact amounts, or by percentage).",
  },
  {
    icon: Scale,
    title: "2. See who owes what",
    body: "Your home screen shows everyone's net balance instantly — green if you're owed, red if you owe. No spreadsheets, no mental math.",
  },
  {
    icon: ArrowRight,
    title: "3. Settle up",
    body: "BILL SPILT works out the fewest possible payments to clear every debt, then you pay with one tap via Venmo or Cash App.",
  },
];

const FEATURES = [
  { icon: Scale, title: "Smart settle-up", body: "A minimum-payments algorithm turns a tangle of IOUs into the shortest list of “A pays B $X.”" },
  { icon: CreditCard, title: "Ways to pay", body: "Share your Venmo or Cash App handle; roommates pay you with a tap, amount pre-filled." },
  { icon: Repeat, title: "Recurring bills", body: "Rent, internet, and subscriptions are logged automatically on schedule." },
  { icon: Camera, title: "Receipt photos", body: "Snap a photo of the receipt and attach it to any expense." },
  { icon: WifiOff, title: "Works offline", body: "Add expenses with no signal — they sync automatically when you reconnect." },
  { icon: Bell, title: "Friendly reminders", body: "Nudge a roommate who owes you with a pre-written message in one tap." },
  { icon: Crown, title: "Household admin", body: "Manage members, transfer ownership, and settle everyone up at once." },
  { icon: Users, title: "Up to 12 roommates", body: "Big house? Add your whole place and keep every shared cost straight." },
];

const FAQ = [
  {
    q: "Is BILL SPILT really free?",
    a: "Yes — free forever, no premium tiers and no credit card. The app is supported by ads, which lets us keep every feature free for roommates.",
  },
  {
    q: "Does BILL SPILT handle the actual payments?",
    a: "No. BILL SPILT calculates who owes what and links you straight to Venmo or Cash App, but the money moves directly between you and your roommates — we never hold or process funds.",
  },
  {
    q: "How does the settle-up work?",
    a: "Instead of everyone paying everyone, BILL SPILT nets all the debts and finds the fewest payments that clear them — so four roommates might settle with just two or three transfers.",
  },
  {
    q: "Can I use it on my phone like an app?",
    a: "Yes. BILL SPILT is a Progressive Web App — add it to your home screen and it runs full-screen and offline, just like a native app, with nothing to install from an app store.",
  },
  {
    q: "How do we split unevenly?",
    a: "Every expense supports three split types: evenly, exact dollar amounts, or by percentage — and you choose exactly who's included.",
  },
];

// Structured data so search engines can show rich results (app listing, FAQ
// accordions). The FAQ schema is generated from the same copy shown on-page,
// so it always matches what a visitor reads.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512.png`,
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web, iOS, Android",
      browserRequirements: "Requires a modern web browser. Installable as a PWA.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free forever — every feature, no paywall.",
      },
      featureList: FEATURES.map((f) => f.title),
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export default async function LandingPage() {
  // Logged-in users go straight to the app.
  const session = await auth();
  if (session?.user) redirect("/home");

  return (
    <div className="min-h-[100dvh] bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {/* AdSense — the landing is public, content-rich, and ad-appropriate. */}
      {ADSENSE_CLIENT && (
        <Script
          id="adsbygoogle-landing"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        />
      )}
      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 safe-top">
        <Brand size="sm" />
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="flex h-10 items-center rounded-md px-4 text-sm font-medium hover:bg-accent"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground active:scale-95"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-5 pb-16 pt-10 text-center sm:pt-20">
        <span className="inline-block rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          🎉 Free forever — every feature, no paywall
        </span>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Every feature, free forever.
          <br />
          <span className="text-primary">No paywall, no catch.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Other bill splitters lock recurring bills, reminders, and receipts
          behind a subscription. BILL SPILT keeps all of it free — split shared
          costs with your roommates, see who owes what instantly, and settle up
          in the fewest payments, without ever reaching for your card.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-95 sm:w-auto"
          >
            Start free — no card needed <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="flex h-12 w-full max-w-xs items-center justify-center rounded-lg border px-8 text-base font-semibold hover:bg-accent sm:w-auto"
          >
            Log in
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No credit card · No premium tier · Free forever
        </p>
      </section>

      {/* How it works */}
      <section className="border-t bg-card/40 py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.title} className="rounded-xl border bg-card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Everything roommates need
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
            From the first grocery run to moving-out day, BILL SPILT keeps every
            shared cost fair and clear.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-5">
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories strip */}
      <section className="border-y bg-card/40 py-12">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <h2 className="text-xl font-bold">Built for every shared cost</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {CATEGORIES.map((c) => (
              <span
                key={c.value}
                className="rounded-full border bg-card px-4 py-2 text-sm font-medium"
              >
                {c.emoji} {c.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-5">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-16">
        <div className="mx-auto max-w-3xl rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Stop chasing your roommates for money.
          </h2>
          <p className="mx-auto mt-3 max-w-md opacity-90">
            Set up your household in a minute and let BILL SPILT do the math.
          </p>
          <Link
            href="/register"
            className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-8 text-base font-semibold text-primary active:scale-95"
          >
            Create your free account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 safe-bottom">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-5 sm:flex-row sm:justify-between">
          <Brand size="sm" />
          <nav className="flex gap-5 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/login" className="hover:underline">Log in</Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} BILL SPILT
          </p>
        </div>
      </footer>
    </div>
  );
}
