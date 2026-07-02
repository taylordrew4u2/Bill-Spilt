import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GuideShell } from "@/components/guide-shell";
import { SITE_URL } from "@/lib/site";

const SLUG = "how-to-split-rent-fairly";
const TITLE = "How to Split Rent Fairly Between Roommates";
const DESCRIPTION =
  "Equal isn't always fair. Five proven methods for splitting rent fairly between roommates — equally, by room size, by square footage, by amenities, and by income — with worked examples and a formula for each.";
const PATH = `/guide/${SLUG}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { type: "article", url: `${SITE_URL}${PATH}`, title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const METHODS = [
  {
    name: "Split rent equally",
    text: "The simplest option: total rent ÷ number of roommates. It's fair when the bedrooms are genuinely comparable in size, light, and privacy. The moment one room is clearly nicer, equal starts to feel unfair — so only default to this when nobody's getting a noticeably better deal.",
  },
  {
    name: "Split by room size or square footage",
    text: "Measure each private bedroom and divide rent in proportion to the space each person gets. Shared areas (kitchen, living room) are counted equally. This is the most defensible method when rooms differ: a roommate with the 200 sq ft master pays more than one in the 120 sq ft box room, in exact proportion.",
  },
  {
    name: "Weight for amenities",
    text: "Adjust for the things square footage misses: an en-suite bathroom, a private balcony, a walk-in closet, or the only room with AC. Agree on a small premium (say 5–15%) for the perk, then split the remainder by size. Write the premium down so it doesn't get re-litigated every month.",
  },
  {
    name: "Split by income (the equity approach)",
    text: "Some households split rent in proportion to take-home pay so the burden feels even relative to means. It's less common and more personal, but for couples or close friends with very different incomes it can be the fairest of all. Only works if everyone's comfortable sharing rough numbers.",
  },
  {
    name: "Bid or auction the rooms",
    text: "When roommates genuinely disagree on what a room is worth, let them price it. Each person secretly writes down the most they'd pay for each room; the assignment that covers the rent and leaves people happiest wins. It sounds clinical, but it surfaces what everyone actually values and ends the argument with numbers instead of feelings.",
  },
];

const FAQ = [
  {
    q: "Is it fair to split rent equally?",
    a: "Only when the bedrooms are genuinely comparable. If one room is larger, brighter, has a private bathroom, or is the only one with air conditioning, an equal split quietly overcharges whoever got the worse room. Equal is the right default for identical rooms and a poor default for anything else.",
  },
  {
    q: "How do you split rent by room size?",
    a: "Add up the square footage of the private bedrooms only, then give each person a share of rent equal to their room's footage divided by the total private footage. Shared spaces like the kitchen and living room are treated as equal for everyone, so they don't enter the calculation. Some households reserve 20–30% of the rent as an 'equal' shared-space charge and split only the remainder by room size.",
  },
  {
    q: "Should the person with the bigger room pay more?",
    a: "Generally yes. More space, more privacy, or a better view are real benefits, and paying in proportion to what you get is what makes a split feel fair. The exact premium is up to the household — proportional to square footage is the cleanest, but a flat 'master bedroom pays $X more' agreed up front works too.",
  },
  {
    q: "How do couples split rent with roommates?",
    a: "A couple usually occupies one bedroom but is two people using the shared spaces, so most households charge the couple more than a single roommate but less than two full shares. A common approach: the couple pays for their room plus a share-and-a-half of the common areas. Agree on it before move-in and write it down.",
  },
  {
    q: "What if we can't agree on who pays what?",
    a: "Try a room auction: each person privately notes the most they'd pay for each bedroom, and you assign rooms to maximize everyone's happiness while covering the total rent. It replaces a stalemate about fairness with concrete numbers everyone chose themselves.",
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
        { "@type": "ListItem", position: 2, name: "How to split rent fairly", item: `${SITE_URL}${PATH}` },
      ],
    },
  ],
};

export default function SplitRentGuide() {
  return (
    <GuideShell slug={SLUG} jsonLd={JSON_LD}>
      <p className="text-sm font-medium text-primary">Guide</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        How to split rent fairly between roommates
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Splitting rent right down the middle is easy — but it&apos;s only fair
        when every bedroom is equal, and they almost never are. One room has the
        en-suite, another is barely bigger than the bed, a third gets all the
        afternoon light. Here are five methods for splitting rent fairly, from
        simplest to most precise, with the math for each.
      </p>

      <div className="mt-10 space-y-8">
        {METHODS.map((m, i) => (
          <section key={m.name}>
            <h2 className="flex items-baseline gap-2 text-xl font-bold">
              <span className="text-primary">{i + 1}.</span> {m.name}
            </h2>
            <p className="mt-2 text-muted-foreground">{m.text}</p>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Worked example: splitting by square footage</h2>
        <p className="mt-2 text-muted-foreground">
          A three-bedroom apartment is <strong>$2,400/month</strong>. The
          private bedrooms measure 200, 150, and 130 sq ft — 480 sq ft total.
          Splitting the full rent in proportion to room size:
        </p>
        <ul className="mt-4 space-y-2 text-muted-foreground">
          <li>• Master (200 sq ft): 200 ÷ 480 × $2,400 = <strong>$1,000</strong></li>
          <li>• Middle (150 sq ft): 150 ÷ 480 × $2,400 = <strong>$750</strong></li>
          <li>• Small (130 sq ft): 130 ÷ 480 × $2,400 = <strong>$650</strong></li>
        </ul>
        <p className="mt-4 text-muted-foreground">
          Prefer to credit the shared spaces equally? Carve out, say, 25% of
          rent ($600) as a flat charge everyone splits three ways ($200 each),
          then divide the remaining $1,800 by room size. The master now pays
          $200 + $750 = $950 — a little less lopsided, which many households
          find lands as the fairest of all.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Worked example: splitting by income</h2>
        <p className="mt-2 text-muted-foreground">
          Two partners share a <strong>$2,000</strong> apartment. One takes home
          $4,000/month, the other $2,000 — a combined $6,000. Splitting rent in
          proportion to income:
        </p>
        <ul className="mt-4 space-y-2 text-muted-foreground">
          <li>• Higher earner: 4,000 ÷ 6,000 × $2,000 = <strong>$1,333</strong></li>
          <li>• Lower earner: 2,000 ÷ 6,000 × $2,000 = <strong>$667</strong></li>
        </ul>
        <p className="mt-4 text-muted-foreground">
          Each pays exactly one-third of their take-home pay, so the rent feels
          equally heavy for both. This only works when everyone opts in and is
          comfortable sharing rough numbers.
        </p>
      </section>

      <section className="mt-12 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-bold">Once you&apos;ve agreed, track it automatically</h2>
        <p className="mt-2 text-muted-foreground">
          However you divide it, rent is a recurring bill — so set it once and
          stop re-entering it. BillSpilt logs rent automatically every month
          with each person&apos;s exact share (equal, exact dollars, or
          percentage), rolls it into the same who-owes-what balance as everything
          else, and is free forever — no paywall, no credit card. You can also{" "}
          <Link href="/split-calculator" className="font-medium text-primary hover:underline">
            try the split calculator
          </Link>{" "}
          to sanity-check the numbers first.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-95"
        >
          Set up your household — free <ArrowRight className="h-4 w-4" />
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
