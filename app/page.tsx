import Link from "next/link";
import { redirect } from "next/navigation";
import { AdSenseScript } from "@/components/adsense-script";
import { SiteFooter } from "@/components/site-footer";
import {
  Receipt,
  Scale,
  CreditCard,
  Repeat,
  Camera,
  WifiOff,
  Bell,
  ArrowRight,
  ArrowUpRight,
  Check,
} from "lucide-react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { Brand } from "@/components/brand";
import { GUIDES, guidePath } from "@/lib/guides";
import { JsonLd } from "@/components/json-ld";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_KEYWORDS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Roommate Bill Splitter — Split Bills & Settle Up, Free | BillSpilt",
  description:
    "BillSpilt is the free roommate bill splitter: split shared bills, see who owes what instantly, and settle up in the fewest payments — no paywall, no credit card. Split rent, utilities & groceries. Works offline.",
  keywords: SITE_KEYWORDS,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Roommate Bill Splitter, Free Forever — BillSpilt",
    description:
      "The free roommate bill splitter. Split shared bills, see who owes what, and settle up in the fewest payments — no paywall, no credit card.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roommate Bill Splitter, Free Forever — BillSpilt",
    description:
      "The free roommate bill splitter. Split shared bills, see who owes what, settle up in the fewest payments.",
  },
};

const STEPS = [
  {
    icon: Receipt,
    title: "1. Log an expense",
    body: "Add what you paid — split it evenly, by exact amounts, or by percentage.",
  },
  {
    icon: Scale,
    title: "2. See who owes what",
    body: "Everyone's balance updates instantly. No spreadsheets, no mental math.",
  },
  {
    icon: ArrowRight,
    title: "3. Settle up",
    body: "BillSpilt finds the fewest payments to clear every debt — pay with one tap via Venmo or Cash App.",
  },
];

const FEATURES = [
  { icon: Scale, title: "Smart settle-up", body: "Turns a tangle of IOUs into the shortest list of “A pays B $X.”" },
  { icon: Repeat, title: "Recurring bills", body: "Rent, internet, and subscriptions log themselves on schedule." },
  { icon: CreditCard, title: "One-tap payments", body: "Roommates pay you via Venmo or Cash App, amount pre-filled." },
  { icon: Bell, title: "Friendly reminders", body: "Nudge whoever owes you with a pre-written message." },
  { icon: Camera, title: "Receipt photos", body: "Snap the receipt and attach it to any expense." },
  { icon: WifiOff, title: "Works offline", body: "Add expenses with no signal — they sync when you reconnect." },
];

const FAQ = [
  {
    q: "What is the best free roommate bill splitter?",
    a: "BillSpilt is a free roommate bill splitter built specifically for shared households: it tracks who paid for what, shows everyone's balance instantly, and settles up in the fewest payments. Unlike many bill splitters, every feature — recurring bills, reminders, receipts, multiple admins — is free forever, with no paywall and no credit card.",
  },
  {
    q: "Is BillSpilt really free?",
    a: "Yes — free forever, no premium tiers and no credit card. The app is supported by ads, which lets us keep every feature free for roommates.",
  },
  {
    q: "Does BillSpilt handle the actual payments?",
    a: "No. BillSpilt calculates who owes what and links you straight to Venmo or Cash App, but the money moves directly between you and your roommates — we never hold or process funds.",
  },
  {
    q: "How does the settle-up work?",
    a: "Instead of everyone paying everyone, BillSpilt nets all the debts and finds the fewest payments that clear them — so four roommates might settle with just two or three transfers.",
  },
  {
    q: "Can I use it on my phone like an app?",
    a: "Yes. BillSpilt is a Progressive Web App — add it to your home screen and it runs full-screen and offline, just like a native app, with nothing to install from an app store.",
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
      alternateName: "Roommate Bill Splitter",
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

/** Static mock of the in-app home screen so first-time visitors instantly see
 *  what the product does. Purely illustrative — hidden from screen readers. */
function AppPreview() {
  const rows = [
    { name: "Sam", note: "owes you", amount: "$24.00" },
    { name: "Priya", note: "owes you", amount: "$12.50" },
  ];
  return (
    <div
      aria-hidden
      className="mx-auto mt-10 w-full max-w-sm rounded-2xl border bg-card p-4 text-left shadow-lg"
    >
      <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-4 text-white">
        <p className="text-xs opacity-90">You are owed</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">$36.50</p>
      </div>
      <ul className="mt-3 divide-y">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {r.name[0]}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.note}</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
              {r.amount}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
        <Check className="h-4 w-4" />
        Settle up: 1 payment clears everything
      </div>
    </div>
  );
}

export default async function LandingPage() {
  // Logged-in users go straight to the app.
  const session = await auth();
  if (session?.user) redirect("/home");

  return (
    <div className="min-h-[100dvh] bg-background">
      <JsonLd data={JSON_LD} />
      {/* AdSense — the landing is public, content-rich, and ad-appropriate. */}
      <AdSenseScript />
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
      <section className="mx-auto max-w-3xl px-5 pb-16 pt-10 text-center sm:pt-16">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Split bills with your roommates.
          <br />
          <span className="text-primary">Settle up in seconds.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          BillSpilt is the free roommate bill splitter: log shared expenses,
          see who owes what instantly, and clear every debt in the fewest
          payments.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/register"
            className="flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-95 sm:w-auto"
          >
            Start splitting — it&apos;s free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Free forever · No credit card · No premium tier
        </p>
        <AppPreview />
        <p className="mt-8 text-sm text-muted-foreground">
          Just need a quick split?{" "}
          <Link
            href="/split-calculator"
            className="font-semibold text-primary hover:underline"
          >
            Use the free calculator — no sign-up →
          </Link>
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
            Rent, utilities, groceries — from the first shared cost to
            moving-out day.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-5">
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Check className="mr-1 inline h-4 w-4 text-primary" aria-hidden />
            Every feature is free — including the ones other bill splitters put
            behind a subscription.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-card/40 py-16">
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
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to this?{" "}
            <Link
              href="/guide/how-to-split-bills-with-roommates"
              className="font-semibold text-primary hover:underline"
            >
              Read our guide on how to split bills with roommates →
            </Link>
          </p>
        </div>
      </section>

      {/* Guides */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Guides for splitting bills with roommates
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Practical, no-fluff advice on dividing rent, utilities, groceries,
            and more — with worked examples and the fairness math spelled out.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GUIDES.map((g) => (
              <Link
                key={g.slug}
                href={guidePath(g.slug)}
                className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <h3 className="font-semibold group-hover:text-primary">
                  {g.title}
                </h3>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Read guide <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
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
            Set up your household in under a minute and let BillSpilt do the
            math. Free forever — no card, no catch.
          </p>
          <Link
            href="/register"
            className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-8 text-base font-semibold text-primary active:scale-95"
          >
            Create your free account <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-sm opacity-80">
            Takes a minute · No credit card · Works on every phone
          </p>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
