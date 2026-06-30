import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GuideShell } from "@/components/guide-shell";
import { SITE_URL } from "@/lib/site";

const SLUG = "how-to-split-utilities-with-roommates";
const TITLE = "How to Split Utility Bills With Roommates";
const DESCRIPTION =
  "Electric, gas, water, internet, trash — a fair, drama-free system for splitting utility bills with roommates, including who to put bills in whose name and how to handle uneven usage.";
const PATH = `/guide/${SLUG}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { type: "article", url: `${SITE_URL}${PATH}`, title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const STEPS = [
  {
    name: "List every utility and how it's billed",
    text: "Electric, gas, water/sewer, internet, trash, and any streaming the house shares. Note which are fixed (internet) and which swing with usage (electric, gas). Knowing which is which tells you where an even split is fine and where it might not be.",
  },
  {
    name: "Spread the accounts across roommates",
    text: "Don't put every bill in one person's name — split who holds which account so no single roommate is fronting all the cash and chasing everyone else. One takes electric, another internet, another water, and so on. It also spreads the credit-history benefit.",
  },
  {
    name: "Default to an even split for shared utilities",
    text: "For most houses, splitting each utility evenly is fair and simple — everyone benefits from heat, water, and Wi-Fi roughly equally. Use exact or percentage splits only when usage is genuinely lopsided (a home office running AC all day, or a roommate who's away half the month).",
  },
  {
    name: "Handle the seasonal swings",
    text: "Electric and gas spike in summer and winter. Rather than re-arguing each month, agree up front to just split the actual bill whatever it is — the person whose name is on it logs the real amount, and everyone pays their share of that month's total.",
  },
  {
    name: "Reconcile everything in one place",
    text: "Because different bills sit with different people, you need one running tally of who's paid what so it all nets out. That's exactly what a roommate bill splitter is for — each utility becomes a logged (often recurring) expense, and the app keeps everyone's balance square.",
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HowTo",
      name: TITLE,
      description: DESCRIPTION,
      step: STEPS.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name,
        text: s.text,
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "BillSpilt", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "How to split utilities with roommates", item: `${SITE_URL}${PATH}` },
      ],
    },
  ],
};

export default function SplitUtilitiesGuide() {
  return (
    <GuideShell slug={SLUG} jsonLd={JSON_LD}>
      <p className="text-sm font-medium text-primary">Guide</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        How to split utility bills with roommates
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Utilities are the messiest shared cost: several bills, different due
        dates, different names on the account, and amounts that change every
        month. Here&apos;s a simple system that keeps it fair.
      </p>

      <div className="mt-10 space-y-8">
        {STEPS.map((s, i) => (
          <section key={s.name}>
            <h2 className="flex items-baseline gap-2 text-xl font-bold">
              <span className="text-primary">{i + 1}.</span> {s.name}
            </h2>
            <p className="mt-2 text-muted-foreground">{s.text}</p>
          </section>
        ))}
      </div>

      <section className="mt-12 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-bold">Put utilities on autopilot</h2>
        <p className="mt-2 text-muted-foreground">
          Add each utility as a recurring bill in BillSpilt and it&apos;s logged
          automatically every month, split how you chose, and folded into one
          who-owes-what balance — even when the bills live in different
          roommates&apos; names. Free forever, no paywall.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-95"
        >
          Start splitting — free <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </GuideShell>
  );
}
