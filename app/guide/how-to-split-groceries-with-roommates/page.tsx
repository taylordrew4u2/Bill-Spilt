import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GuideShell } from "@/components/guide-shell";
import { SITE_URL } from "@/lib/site";

const SLUG = "how-to-split-groceries-with-roommates";
const TITLE = "How to Split Groceries With Roommates Fairly";
const DESCRIPTION =
  "Shared groceries are where roommate budgets get messy. Four systems for splitting groceries fairly — the shared-staples list, full pooling, take-turns shopping, and strictly separate — plus how to keep personal food personal.";
const PATH = `/guide/${SLUG}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { type: "article", url: `${SITE_URL}${PATH}`, title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const SYSTEMS = [
  {
    name: "Shared staples, personal food separate",
    text: "The most popular system. The house splits a short list of shared basics everyone uses — cooking oil, salt and spices, dish soap, paper towels, coffee, maybe milk and eggs — while anything you buy for yourself stays yours. It keeps the shared spend small and predictable and sidesteps the 'who ate my leftovers' problem entirely.",
  },
  {
    name: "Full pooling (one shared kitchen)",
    text: "Everyone contributes to a common grocery fund and all food is fair game. This works beautifully for roommates who cook together and eat similarly, and terribly when diets, budgets, or appetites differ. If you pool, split the total evenly and settle up weekly so the fund never runs dry or drifts out of balance.",
  },
  {
    name: "Take turns shopping",
    text: "Instead of splitting every receipt, roommates rotate who buys the shared groceries. Over a few weeks it roughly evens out — but 'roughly' is the risk. Log each shop so you can see whether it's actually balanced; one person quietly buying more expensive weeks is how this quietly turns unfair.",
  },
  {
    name: "Strictly separate",
    text: "Everyone buys, stores, and eats their own food, and the only shared cost is a tiny list of communal supplies. It's the least social option but the least drama — ideal for roommates with very different diets, schedules, or spending levels, or when a previous food-sharing arrangement went sour.",
  },
];

const FAQ = [
  {
    q: "Should roommates split groceries?",
    a: "Split the things everyone genuinely shares — staples, condiments, cleaning supplies, paper goods — and keep personal food personal. Trying to share every item invites conflict over who eats more, while sharing nothing means five half-empty bottles of olive oil. A short shared-staples list split evenly is the sweet spot for most households.",
  },
  {
    q: "What groceries should be shared vs personal?",
    a: "Good candidates for shared: cooking oil, salt, spices, condiments, dish soap, sponges, paper towels, trash bags, foil, coffee and tea, and sometimes staples like milk, eggs, and bread. Keep personal: snacks, specific brands you prefer, meal-prep ingredients, dietary or specialty items, and anything one person goes through far faster than the others.",
  },
  {
    q: "How do you split a grocery bill that mixes shared and personal items?",
    a: "Log only the shared portion. If a $90 trip included $30 of your own snacks and specialty items, record a $60 shared expense split among the household and simply leave your $30 off the ledger. A bill splitter that supports exact amounts makes this a few taps rather than a spreadsheet.",
  },
  {
    q: "How often should roommates settle up on groceries?",
    a: "Weekly or every two weeks works well for groceries because trips are frequent and amounts are small — settling often keeps any one person from fronting too much. If you'd rather batch it, fold groceries into a single monthly settle-up alongside rent and utilities so it all nets out in one or two payments.",
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
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "BillSpilt", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "How to split groceries with roommates", item: `${SITE_URL}${PATH}` },
      ],
    },
  ],
};

export default function SplitGroceriesGuide() {
  return (
    <GuideShell slug={SLUG} jsonLd={JSON_LD}>
      <p className="text-sm font-medium text-primary">Guide</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        How to split groceries with roommates fairly
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Rent is one number a month. Groceries are a dozen small trips, mixed
        carts, and the eternal question of who finished the milk. That&apos;s why
        food is where shared-household budgets quietly go wrong. Here are four
        systems that work — pick the one that fits how your house actually eats.
      </p>

      <div className="mt-10 space-y-8">
        {SYSTEMS.map((s, i) => (
          <section key={s.name}>
            <h2 className="flex items-baseline gap-2 text-xl font-bold">
              <span className="text-primary">{i + 1}.</span> {s.name}
            </h2>
            <p className="mt-2 text-muted-foreground">{s.text}</p>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">A worked example</h2>
        <p className="mt-2 text-muted-foreground">
          Three roommates run the shared-staples system. This week Maya does the
          big shop: <strong>$96 total</strong>, of which <strong>$60</strong> is
          shared staples (oil, coffee, eggs, cleaning supplies) and{" "}
          <strong>$36</strong> is her own snacks and a specialty flour. She logs
          a $60 shared expense split three ways — <strong>$20 each</strong> — and
          leaves her $36 off the ledger. The other two owe her $20 apiece;
          she&apos;s already covered her own share by paying the bill.
        </p>
        <p className="mt-4 text-muted-foreground">
          Need to divide a mixed cart quickly?{" "}
          <Link href="/split-calculator" className="font-medium text-primary hover:underline">
            The free split calculator
          </Link>{" "}
          handles even and custom splits with no sign-up.
        </p>
      </section>

      <section className="mt-12 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-bold">Keep the grocery ledger effortless</h2>
        <p className="mt-2 text-muted-foreground">
          Snap the receipt, enter the shared amount, and split it evenly or by
          exact amounts — BillSpilt keeps a running balance so groceries settle
          up alongside rent and utilities in the fewest payments. Free forever,
          no paywall, no credit card.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-95"
        >
          Start splitting groceries — free <ArrowRight className="h-4 w-4" />
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
    </GuideShell>
  );
}
