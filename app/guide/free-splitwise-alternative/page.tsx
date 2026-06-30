import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { GuideShell } from "@/components/guide-shell";
import { SITE_URL } from "@/lib/site";

const SLUG = "free-splitwise-alternative";
const TITLE = "The Best Free Splitwise Alternative for Roommates";
const DESCRIPTION =
  "Looking for a free alternative to Splitwise? BillSpilt is a free roommate bill splitter with every feature included — unlimited expenses, recurring bills, reminders, and minimum-payment settle-up — no paywall, no premium tier, no credit card.";
const PATH = `/guide/${SLUG}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { type: "article", url: `${SITE_URL}${PATH}`, title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const INCLUDED = [
  "Unlimited expenses and households",
  "Equal, exact, and percentage splits",
  "Minimum-payments settle-up (fewest transfers)",
  "Recurring bills (rent, internet, subscriptions)",
  "Receipt photos and CSV export",
  "Payment reminders via Venmo / Cash App",
  "Works offline, installs to your home screen",
];

const FAQ = [
  {
    q: "Is there a free alternative to Splitwise?",
    a: "Yes. BillSpilt is a free roommate bill splitter where every feature is included at no cost — there's no premium tier and no credit card required. It covers the essentials most roommates use a bill splitter for: tracking shared expenses, seeing who owes what, and settling up in the fewest payments.",
  },
  {
    q: "Why is BillSpilt free?",
    a: "BillSpilt is supported by unobtrusive ads, which lets every feature stay free for roommates rather than gating them behind a subscription.",
  },
  {
    q: "Do I need to install anything?",
    a: "No app store needed. BillSpilt is a Progressive Web App — open it in your browser and add it to your home screen, where it runs full-screen and offline like a native app.",
  },
  {
    q: "Does it handle the actual payments?",
    a: "No — and that's by design. BillSpilt calculates who owes what and links you straight to Venmo or Cash App, but money moves directly between you and your roommates. It never holds or processes funds.",
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: TITLE,
      description: DESCRIPTION,
      mainEntityOfPage: `${SITE_URL}${PATH}`,
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export default function SplitwiseAlternativeGuide() {
  return (
    <GuideShell slug={SLUG} jsonLd={JSON_LD}>
      <p className="text-sm font-medium text-primary">Guide</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        The best free Splitwise alternative for roommates
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        If you&apos;ve bumped into limits or paywalls in another bill splitter,
        BillSpilt is a genuinely free alternative built for roommates — every
        feature included, no premium tier, no credit card.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Everything included, free</h2>
        <ul className="mt-4 space-y-2.5">
          {INCLUDED.map((t) => (
            <li key={t} className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">What makes it a good switch</h2>
        <p className="mt-2 text-muted-foreground">
          BillSpilt focuses on the core job a roommate bill splitter needs to do
          and does it without nickel-and-diming: a smart settle-up that nets
          everyone&apos;s debts into the fewest payments, private per-person split
          breakdowns, multiple household admins, and offline support so you can
          log an expense on a plane. It&apos;s mobile-first and installs to your
          home screen — no app store, nothing to pay.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">FAQ</h2>
        <div className="mt-4 space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border bg-card p-6 text-center">
        <h2 className="text-xl font-bold">Switch in under a minute</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Create your household, share a one-tap invite link, and start
          splitting. Free forever.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-95"
        >
          Get started — it&apos;s free <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </GuideShell>
  );
}
