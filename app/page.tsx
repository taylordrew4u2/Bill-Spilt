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
  ArrowDownLeft,
  BookOpen,
  Check,
  ChevronRight,
} from "lucide-react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { MarketingHeader } from "@/components/marketing-header";
import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
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
 *  what the product does. Purely illustrative — hidden from screen readers.
 *  Styled like the real Home screen (balance hero + roommate rows). */
function AppPreview() {
  const rows = [
    { id: "preview-sam", name: "Sam", note: "owes you", amount: "$24.00" },
    { id: "preview-priya", name: "Priya", note: "owes you", amount: "$12.50" },
  ];
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-primary/10 blur-2xl" />
      <div className="rounded-3xl border bg-card p-3 text-left shadow-[0_1px_2px_rgb(0_0_0/0.04),0_16px_40px_-16px_rgb(0_0_0/0.18)]">
        <div className="rounded-2xl border border-positive/20 bg-positive-soft p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-positive/15 text-positive">
              <ArrowDownLeft className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <p className="text-base font-semibold">You are owed</p>
          </div>
          <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-positive">
            $36.50
          </p>
        </div>
        <ul className="divide-y px-1">
          {rows.map((r) => (
            <li key={r.name} className="flex min-h-14 items-center gap-3 py-3">
              <MemberAvatar id={r.id} name={r.name} className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="text-base font-medium leading-snug">{r.name}</p>
                <p className="text-sm text-muted-foreground">{r.note}</p>
              </div>
              <span className="flex-shrink-0 whitespace-nowrap text-base font-semibold tabular-nums text-positive">
                {r.amount}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-balance rounded-2xl bg-primary/10 px-3 py-3 text-center text-sm font-semibold text-primary">
          <Check className="-mt-0.5 mr-1.5 inline h-4 w-4" strokeWidth={2.6} />
          Settle up: 2 payments clear everything
        </p>
      </div>
    </div>
  );
}

/** Centered section heading + optional lede, shared by every landing section. */
function SectionHeading({
  title,
  lede,
}: {
  title: string;
  lede?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {lede && (
        <p className="mx-auto mt-3 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          {lede}
        </p>
      )}
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
      <MarketingHeader />

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
        />
        <div className="mx-auto max-w-3xl px-gutter pb-14 pt-10 text-center sm:pb-20 sm:pt-20">
          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight min-[400px]:text-4xl sm:text-5xl sm:leading-[1.08] md:text-6xl">
            Split bills with your roommates.
            <br />
            <span className="text-primary">Settle up in seconds.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground min-[400px]:text-lg sm:text-xl sm:leading-8">
            BillSpilt is the free roommate bill splitter: log shared expenses,
            see who owes what instantly, and clear every debt in the fewest
            payments.
          </p>

          {/* Two stacked, full-width actions: sign up, or just use the free
              calculator. */}
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/register">
                Start splitting — it&apos;s free <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Link
              href="/split-calculator"
              className="group flex min-h-14 w-full items-center gap-3 rounded-xl border border-input bg-card px-4 py-2.5 text-left transition-colors hover:bg-accent active:bg-accent"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-muted-foreground">
                  Just need a quick split?
                </span>
                <span className="block text-balance text-base font-semibold leading-snug text-primary">
                  Use the free calculator —{" "}
                  <span className="whitespace-nowrap">no sign-up</span>
                </span>
              </span>
              <ChevronRight
                className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>

          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm font-medium text-muted-foreground"
          >
            {["Free forever", "No credit card", "No premium tier"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-positive" strokeWidth={2.6} aria-hidden />
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-12 sm:mt-16">
            <AppPreview />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-card py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-gutter">
          <SectionHeading title="How it works" />
          {/* A vertical timeline on phones, three cards side by side up. */}
          <ol className="mx-auto mt-10 max-w-md sm:grid sm:max-w-none sm:grid-cols-3 sm:gap-6">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="relative flex gap-4 pb-9 last:pb-0 sm:flex-col sm:gap-0 sm:rounded-2xl sm:border sm:bg-background sm:p-6"
              >
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute bottom-2 left-6 top-[3.75rem] w-0.5 -translate-x-1/2 rounded-full bg-primary/20 sm:hidden"
                  />
                )}
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <s.icon className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0 pt-2.5 sm:mt-5 sm:pt-0">
                  <h3 className="text-lg font-semibold leading-snug">{s.title}</h3>
                  <p className="mt-1.5 text-base text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-gutter">
          <SectionHeading
            title="Everything roommates need"
            lede="Rent, utilities, groceries — from the first shared cost to moving-out day."
          />
          {/* One grouped panel with hairline dividers: a list on phones, a
              grid from `sm` up. */}
          <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl border bg-border shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li
                key={f.title}
                className="flex gap-4 bg-card p-4 sm:flex-col sm:gap-0 sm:p-6"
              >
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-6 w-6" aria-hidden />
                </span>
                <div className="min-w-0 pt-0.5 sm:mt-4 sm:pt-0">
                  <h3 className="text-base font-semibold leading-snug sm:text-lg">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-5 flex max-w-2xl items-start gap-3 rounded-2xl bg-primary/10 p-4 text-left text-sm font-medium text-foreground sm:items-center sm:justify-center sm:text-center">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-4 w-4" strokeWidth={2.6} aria-hidden />
            </span>
            Every feature is free — including the ones other bill splitters put
            behind a subscription.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y bg-card py-14 sm:py-20">
        <div className="mx-auto max-w-2xl px-gutter">
          <SectionHeading title="Frequently asked questions" />
          <div className="mt-8 divide-y border-y">
            {FAQ.map((item) => (
              <div key={item.q} className="py-6">
                <h3 className="text-lg font-semibold leading-snug">{item.q}</h3>
                <p className="mt-2 text-base text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-base text-muted-foreground">
            New to this?{" "}
            <Link
              href="/guide/how-to-split-bills-with-roommates"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Read our guide on how to split bills with roommates →
            </Link>
          </p>
        </div>
      </section>

      {/* Guides */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-gutter">
          <SectionHeading
            title="Guides for splitting bills with roommates"
            lede="Practical, no-fluff advice on dividing rent, utilities, groceries, and more — with worked examples and the fairness math spelled out."
          />
          <ul className="mt-10 divide-y overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
            {GUIDES.map((g) => (
              <li key={g.slug}>
                <Link
                  href={guidePath(g.slug)}
                  className="group flex min-h-16 items-center gap-4 px-4 py-4 transition-colors hover:bg-accent/60 active:bg-accent sm:px-5"
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold leading-snug group-hover:text-primary">
                      {g.title}
                    </h3>
                    <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Read guide <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-gutter pb-14 sm:pb-20">
        <div className="relative isolate mx-auto max-w-3xl overflow-hidden rounded-3xl bg-primary px-5 py-10 text-center text-primary-foreground sm:px-12 sm:py-14">
          <div
            aria-hidden
            className="absolute -right-16 -top-20 -z-10 h-56 w-56 rounded-full bg-primary-foreground/10"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-16 -z-10 h-64 w-64 rounded-full bg-primary-foreground/[0.07]"
          />
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Stop chasing your roommates for money.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-balance text-lg text-primary-foreground/90">
            Set up your household in under a minute and let BillSpilt do the
            math. Free forever — no card, no catch.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex h-14 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary-foreground px-4 text-lg font-semibold text-primary shadow-sm transition-transform active:scale-[0.98] max-[359px]:text-base sm:w-auto sm:px-8"
          >
            Create your free account{" "}
            <ArrowRight className="h-5 w-5 flex-shrink-0 max-[359px]:hidden" aria-hidden />
          </Link>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm font-medium text-primary-foreground/90">
            {["Takes a minute", "No credit card", "Works on every phone"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4" strokeWidth={2.6} aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
