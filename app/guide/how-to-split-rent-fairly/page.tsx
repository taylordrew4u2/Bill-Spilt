import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GuideShell } from "@/components/guide-shell";
import { SITE_URL } from "@/lib/site";

const SLUG = "how-to-split-rent-fairly";
const TITLE = "How to Split Rent Fairly Between Roommates";
const DESCRIPTION =
  "Equal isn't always fair. Four proven methods for splitting rent fairly between roommates — by room size, by square footage, by income, and by amenities — plus how to track it once you've decided.";
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
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "BILL SPILT", item: SITE_URL },
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
        when every bedroom is equal, and they almost never are. Here are four
        methods for splitting rent fairly, from simplest to most precise.
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

      <section className="mt-12 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-bold">Once you&apos;ve agreed, track it automatically</h2>
        <p className="mt-2 text-muted-foreground">
          However you divide it, rent is a recurring bill — so set it once and
          stop re-entering it. BILL SPILT logs rent automatically every month
          with each person&apos;s exact share (equal, exact dollars, or
          percentage), rolls it into the same who-owes-what balance as everything
          else, and is free forever — no paywall, no credit card.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-95"
        >
          Set up your household — free <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </GuideShell>
  );
}
