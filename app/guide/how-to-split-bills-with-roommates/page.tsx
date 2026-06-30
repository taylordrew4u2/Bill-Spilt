import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { GuideShell } from "@/components/guide-shell";
import { SITE_URL } from "@/lib/site";

const SLUG = "how-to-split-bills-with-roommates";
const TITLE = "How to Split Bills With Roommates (Without the Awkwardness)";
const DESCRIPTION =
  "A simple, fair system for splitting bills with roommates: agree on what's shared, pick a split method, log expenses as they happen, and settle up in the fewest payments. Plus a free roommate bill splitter that does the math for you.";
const PATH = `/guide/${SLUG}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    type: "article",
    url: `${SITE_URL}${PATH}`,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const STEPS = [
  {
    name: "Agree on what counts as a shared bill",
    text: "Before money changes hands, decide together what the household actually splits — rent, utilities, internet, shared groceries, household supplies — and what stays personal. Writing it down once prevents 90% of the arguments later.",
  },
  {
    name: "Pick a split method that feels fair",
    text: "Equal splits are simplest, but they aren't always fair: a bigger bedroom might pay more rent, and only three of four roommates might share the streaming bill. Choose between splitting evenly, by exact dollar amounts, or by percentage — per expense, not just per household.",
  },
  {
    name: "Log every shared expense as it happens",
    text: "The system breaks the moment someone 'remembers later.' Record each shared cost when you pay it — who paid, how much, and who's included — so nothing is forgotten and no one has to keep receipts in a drawer.",
  },
  {
    name: "Track who owes what in one place",
    text: "Instead of a tangle of 'you owe me / I owe you,' keep a running net balance for each person. At any moment everyone can see whether they're owed money or owe it, with no spreadsheet and no mental math.",
  },
  {
    name: "Settle up in the fewest payments",
    text: "When it's time to square up, you don't need everyone to pay everyone. Net all the debts and find the shortest list of transfers that clears them — four roommates can often settle with just two or three payments.",
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HowTo",
      name: "How to Split Bills With Roommates",
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
        { "@type": "ListItem", position: 1, name: "BILL SPILT", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "How to split bills with roommates",
          item: `${SITE_URL}${PATH}`,
        },
      ],
    },
  ],
};

export default function GuidePage() {
  return (
    <GuideShell slug={SLUG} jsonLd={JSON_LD}>
      <p className="text-sm font-medium text-primary">Guide</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          How to split bills with roommates (without the awkwardness)
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Sharing a place is easy. Sharing the bills is where roommates fall out.
          Here&apos;s a simple, fair system for splitting bills with roommates —
          and how a free roommate bill splitter can do the tedious parts for you.
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
          <h2 className="text-xl font-bold">
            Let a free roommate bill splitter do the math
          </h2>
          <p className="mt-2 text-muted-foreground">
            Doing all of this by hand works, but it&apos;s a chore. BILL SPILT is
            a free roommate bill splitter built for exactly this: log a shared
            expense in seconds, see everyone&apos;s balance update instantly, and
            get the fewest-payments plan when it&apos;s time to settle up. Every
            feature is free — no paywall, no premium tier, no credit card.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              "Equal, exact, or percentage splits — per expense",
              "Live who-owes-what balances for the whole house",
              "Minimum-payments settle-up, paid via Venmo or Cash App",
              "Recurring rent & utilities logged automatically",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-95"
          >
            Start splitting — free forever <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <p className="mt-10 text-sm text-muted-foreground">
          More:{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            BILL SPILT — the free roommate bill splitter
          </Link>
        </p>
    </GuideShell>
  );
}
