import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { GuideShell } from "@/components/guide-shell";
import { SITE_URL } from "@/lib/site";

const SLUG = "how-to-split-bills-with-roommates";
const TITLE = "How to Split Bills With Roommates (Without the Awkwardness)";
const DESCRIPTION =
  "A complete, fair system for splitting bills with roommates: agree on what's shared, pick a split method, log expenses as they happen, and settle up in the fewest payments. With worked examples and a free bill splitter that does the math for you.";
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

const METHODS = [
  {
    method: "Split evenly",
    best: "Rent with equal rooms, internet, shared streaming, trash",
    how: "Total ÷ number of people included",
  },
  {
    method: "Exact amounts",
    best: "A grocery run where one person also bought their own items",
    how: "Enter each person's precise share; the rest is even",
  },
  {
    method: "By percentage",
    best: "Unequal incomes, unequal room sizes, part-time roommates",
    how: "Assign a % to each person (must total 100%)",
  },
];

const MISTAKES = [
  "Letting small amounts pile up. A $12 here and $20 there quietly becomes an awkward $180 ask three months later. Settle little and often.",
  "Putting every bill in one person's name. That roommate ends up fronting all the cash and chasing everyone — spread the accounts around.",
  "Splitting everything evenly out of habit. If only two of three roommates use the gym membership or the premium streaming tier, the third shouldn't pay for it.",
  "Relying on memory. 'I'm pretty sure you owe me' is where roommate friendships go to die. Log it when it happens, not from memory weeks later.",
  "Never actually settling. A perfect ledger is useless if the money never moves. Pick a regular settle-up day — payday, or the 1st of the month.",
];

const FAQ = [
  {
    q: "What's the fairest way to split bills with roommates?",
    a: "There isn't one method that's fairest for everything — the fairest system splits each expense by the method that fits it. Split rent and internet evenly when everyone benefits equally, use exact amounts when one person's share genuinely differs, and use percentages when incomes or room sizes are very different. The key is agreeing on the rule before the bill arrives, not after.",
  },
  {
    q: "Should roommates split groceries?",
    a: "Split shared staples everyone uses — cooking oil, cleaning supplies, toilet paper, coffee — and keep personal groceries personal. The simplest system is a shared 'house' list that gets split evenly, while anything you buy just for yourself stays off the ledger. If one shopping trip mixes both, log only the shared portion.",
  },
  {
    q: "How often should roommates settle up?",
    a: "Monthly is the sweet spot for most households — it lines up with rent and utility cycles and keeps each person's balance small enough to clear in one or two payments. Settling weekly can feel like nagging; waiting a whole semester lets balances grow large and tense. Pick a recurring day and stick to it.",
  },
  {
    q: "What if a roommate refuses to pay their share?",
    a: "Start with a specific, friendly reminder that references the exact expenses and amount — vague asks are easy to brush off. Having a clear shared record removes the 'I don't remember agreeing to that' defense. If it keeps happening, put larger bills in that person's name so they're the one fronting the cost, and consider requiring their share up front for big purchases.",
  },
  {
    q: "Do we need an app, or is a spreadsheet enough?",
    a: "A spreadsheet works for two organized people. Once you have three or more roommates and recurring bills, the manual math and the who-owes-whom untangling get old fast. A bill splitter logs each expense in seconds, keeps a live balance for everyone, and calculates the fewest payments to settle — which is the part a spreadsheet can't do well.",
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
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "BillSpilt", item: SITE_URL },
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
        Money resentment rarely starts with a big blow-up — it builds quietly
        from a dozen small &ldquo;I&apos;ll get you back&rdquo; moments that
        never quite happen. This guide lays out a simple, fair system for
        splitting bills with roommates, with real numbers, the mistakes to
        avoid, and how a free roommate bill splitter can do the tedious parts
        for you.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">The five-step system</h2>
        <p className="mt-2 text-muted-foreground">
          Almost every roommate money problem traces back to a missing step
          below. Get all five right and shared costs basically run themselves.
        </p>
        <div className="mt-6 space-y-8">
          {STEPS.map((s, i) => (
            <section key={s.name}>
              <h3 className="flex items-baseline gap-2 text-xl font-bold">
                <span className="text-primary">{i + 1}.</span> {s.name}
              </h3>
              <p className="mt-2 text-muted-foreground">{s.text}</p>
            </section>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Which split method to use</h2>
        <p className="mt-2 text-muted-foreground">
          &ldquo;Split it evenly&rdquo; is the default, but it&apos;s only fair
          when everyone benefits equally. Match the method to the expense:
        </p>
        <div className="mt-5 overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-card">
              <tr className="border-b">
                <th className="p-3 font-semibold">Method</th>
                <th className="p-3 font-semibold">Best for</th>
                <th className="p-3 font-semibold">How it works</th>
              </tr>
            </thead>
            <tbody>
              {METHODS.map((m) => (
                <tr key={m.method} className="border-b last:border-0">
                  <td className="p-3 font-medium">{m.method}</td>
                  <td className="p-3 text-muted-foreground">{m.best}</td>
                  <td className="p-3 text-muted-foreground">{m.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">A worked example</h2>
        <p className="mt-2 text-muted-foreground">
          Say three roommates — Ava, Ben, and Cara — share a month:
        </p>
        <ul className="mt-4 space-y-2 text-muted-foreground">
          <li>• Ava pays the <strong>$1,800 rent</strong> (split evenly = $600 each).</li>
          <li>• Ben pays the <strong>$150 electric bill</strong> (even = $50 each).</li>
          <li>• Cara pays <strong>$90 for shared groceries</strong> (even = $30 each).</li>
        </ul>
        <p className="mt-4 text-muted-foreground">
          Total shared spend is $2,040, so each person&apos;s fair share is
          $680. Ava paid $1,800, Ben paid $150, Cara paid $90. The naive way to
          settle is six little payments flying in every direction. The smart way
          nets it out: Ben owes $530 and Cara owes $590, and both simply pay
          Ava. That&apos;s <strong>two payments instead of six</strong> — and
          nobody has to work out the math by hand.
        </p>
        <p className="mt-4 text-muted-foreground">
          Want to try your own numbers first?{" "}
          <Link
            href="/split-calculator"
            className="font-medium text-primary hover:underline"
          >
            Use the free split calculator
          </Link>{" "}
          — no sign-up needed.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Common mistakes to avoid</h2>
        <ul className="mt-5 space-y-3">
          {MISTAKES.map((m) => (
            <li key={m} className="flex items-start gap-2.5">
              <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
              <span className="text-muted-foreground">{m}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-bold">
          Let a free roommate bill splitter do the math
        </h2>
        <p className="mt-2 text-muted-foreground">
          Doing all of this by hand works, but it&apos;s a chore. BillSpilt is a
          free roommate bill splitter built for exactly this: log a shared
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

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Frequently asked questions</h2>
        <div className="mt-5 space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        More:{" "}
        <Link href="/" className="font-medium text-primary hover:underline">
          BillSpilt — the free roommate bill splitter
        </Link>
      </p>
    </GuideShell>
  );
}
