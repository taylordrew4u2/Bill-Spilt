import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  ArticleCta,
  ArticleHeader,
  ArticleSection,
  Bullet,
  BulletList,
  GuideShell,
  NumberedSections,
  Paragraph,
  proseLink,
  proseText,
} from "@/components/guide-shell";
import { FaqSection, faqJsonLd } from "@/components/faq-section";
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
    faqJsonLd(FAQ),
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
      <ArticleHeader
        eyebrow="Guide"
        title="How to split bills with roommates (without the awkwardness)"
      >
        Sharing a place is easy. Sharing the bills is where roommates fall out.
        Money resentment rarely starts with a big blow-up — it builds quietly
        from a dozen small &ldquo;I&apos;ll get you back&rdquo; moments that
        never quite happen. This guide lays out a simple, fair system for
        splitting bills with roommates, with real numbers, the mistakes to
        avoid, and how a free roommate bill splitter can do the tedious parts
        for you.
      </ArticleHeader>

      <ArticleSection title="The five-step system" className="mt-10 md:mt-12">
        <Paragraph>
          Almost every roommate money problem traces back to a missing step
          below. Get all five right and shared costs basically run themselves.
        </Paragraph>
        <NumberedSections items={STEPS} headingLevel="h3" className="pt-4" />
      </ArticleSection>

      <ArticleSection title="Which split method to use">
        <Paragraph>
          &ldquo;Split it evenly&rdquo; is the default, but it&apos;s only fair
          when everyone benefits equally. Match the method to the expense:
        </Paragraph>
        {/* A real table on wide screens; on a phone each row restacks into a
            card with its column names as labels, so nothing is squeezed into
            three 80px columns. */}
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="block w-full text-left md:table">
            <thead className="hidden border-b bg-muted/50 md:table-header-group">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold">Method</th>
                <th className="px-4 py-3 text-sm font-semibold">Best for</th>
                <th className="px-4 py-3 text-sm font-semibold">How it works</th>
              </tr>
            </thead>
            <tbody className="block divide-y md:table-row-group">
              {METHODS.map((m) => (
                <tr key={m.method} className="block px-4 py-4 md:table-row md:p-0">
                  <td className="block text-lg font-semibold md:table-cell md:px-4 md:py-3 md:align-top md:text-base">
                    {m.method}
                  </td>
                  <td
                    data-label="Best for"
                    className="mt-3 block text-base text-foreground/85 before:mb-0.5 before:block before:text-sm before:font-semibold before:text-muted-foreground before:content-[attr(data-label)] md:mt-0 md:table-cell md:px-4 md:py-3 md:align-top md:before:hidden"
                  >
                    {m.best}
                  </td>
                  <td
                    data-label="How it works"
                    className="mt-3 block text-base text-foreground/85 before:mb-0.5 before:block before:text-sm before:font-semibold before:text-muted-foreground before:content-[attr(data-label)] md:mt-0 md:table-cell md:px-4 md:py-3 md:align-top md:before:hidden"
                  >
                    {m.how}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ArticleSection>

      <ArticleSection title="A worked example">
        <Paragraph>
          Say three roommates — Ava, Ben, and Cara — share a month:
        </Paragraph>
        <BulletList>
          <Bullet>Ava pays the <strong>$1,800 rent</strong> (split evenly = $600 each).</Bullet>
          <Bullet>Ben pays the <strong>$150 electric bill</strong> (even = $50 each).</Bullet>
          <Bullet>Cara pays <strong>$90 for shared groceries</strong> (even = $30 each).</Bullet>
        </BulletList>
        <Paragraph>
          Total shared spend is $2,040, so each person&apos;s fair share is
          $680. Ava paid $1,800, Ben paid $150, Cara paid $90. The naive way to
          settle is six little payments flying in every direction. The smart way
          nets it out: Ben owes $530 and Cara owes $590, and both simply pay
          Ava. That&apos;s <strong>two payments instead of six</strong> — and
          nobody has to work out the math by hand.
        </Paragraph>
        <Paragraph>
          Want to try your own numbers first?{" "}
          <Link href="/split-calculator" className={proseLink}>
            Use the free split calculator
          </Link>{" "}
          — no sign-up needed.
        </Paragraph>
      </ArticleSection>

      <ArticleSection title="Common mistakes to avoid">
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {MISTAKES.map((m) => (
            <li key={m} className="flex items-start gap-3 px-4 py-4">
              <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" aria-hidden />
              <span className={proseText}>{m}</span>
            </li>
          ))}
        </ul>
      </ArticleSection>

      <ArticleCta
        title="Let a free roommate bill splitter do the math"
        cta="Start splitting — free forever"
      >
        <Paragraph>
          Doing all of this by hand works, but it&apos;s a chore. BillSpilt is a
          free roommate bill splitter built for exactly this: log a shared
          expense in seconds, see everyone&apos;s balance update instantly, and
          get the fewest-payments plan when it&apos;s time to settle up. Every
          feature is free — no paywall, no premium tier, no credit card.
        </Paragraph>
        <ul className="space-y-3">
          {[
            "Equal, exact, or percentage splits — per expense",
            "Live who-owes-what balances for the whole house",
            "Minimum-payments settle-up, paid via Venmo or Cash App",
            "Recurring rent & utilities logged automatically",
          ].map((t) => (
            <li key={t} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-positive" aria-hidden />
              <span className="text-base font-medium leading-snug">{t}</span>
            </li>
          ))}
        </ul>
      </ArticleCta>

      <FaqSection faq={FAQ} />

      <p className="mt-10 text-sm text-muted-foreground">
        More:{" "}
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
        >
          BillSpilt — the free roommate bill splitter
        </Link>
      </p>
    </GuideShell>
  );
}
