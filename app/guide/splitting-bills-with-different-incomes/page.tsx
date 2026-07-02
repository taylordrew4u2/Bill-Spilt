import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GuideShell } from "@/components/guide-shell";
import { SITE_URL } from "@/lib/site";

const SLUG = "splitting-bills-with-different-incomes";
const TITLE = "How to Split Bills When Roommates Earn Different Amounts";
const DESCRIPTION =
  "When one roommate earns far more than another, a 50/50 split can feel unfair. Here's how to split bills proportionally to income — with the formula, a worked example, and how to keep it drama-free.";
const PATH = `/guide/${SLUG}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { type: "article", url: `${SITE_URL}${PATH}`, title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const APPROACHES = [
  {
    name: "Proportional to income",
    text: "The classic equity approach: each person pays a share of the shared bills equal to their income divided by the household's total income. Someone earning twice as much pays twice as much. It makes the household budget feel equally heavy for everyone, which is what people usually mean by 'fair' when incomes differ a lot.",
  },
  {
    name: "Equal split on some bills, proportional on others",
    text: "A middle path many couples and close roommates prefer: split usage-based costs (groceries, streaming, the things everyone consumes similarly) evenly, but split the big fixed cost — rent — proportionally to income. It keeps the small stuff simple and applies the equity adjustment where it matters most.",
  },
  {
    name: "Equal split with a 'leftover' floor",
    text: "Split everything evenly, but check that the lower earner is left with a reasonable amount after their share. If an even split would leave them with almost nothing while the higher earner has plenty, shift the balance until both have breathing room. Less precise, but humane and easy to agree on.",
  },
];

const FAQ = [
  {
    q: "Is it fair to split bills 50/50 when one person earns more?",
    a: "It depends on the gap. When incomes are similar, a 50/50 split is simple and fair. When one person earns significantly more, an even split can take a painful chunk of the lower earner's income while barely touching the higher earner's — so many households switch to splitting rent (and sometimes all bills) in proportion to income. There's no universal right answer; what matters is that everyone agrees to the rule beforehand.",
  },
  {
    q: "How do you split rent proportionally to income?",
    a: "Add up everyone's take-home pay to get the household total. Each person's share of rent equals their income divided by that total, times the rent. For example, if one partner earns $4,000 and the other $2,000, the household total is $6,000; on $2,000 rent the higher earner pays 4,000/6,000 × $2,000 = $1,333 and the lower earner pays $667. Each ends up spending the same fraction of their income on rent.",
  },
  {
    q: "Should couples split bills based on income?",
    a: "Many do, especially when there's a meaningful income gap, because it keeps the financial pressure even and avoids one partner feeling constantly stretched. Others prefer strict 50/50 for simplicity, or a hybrid where big fixed costs are proportional and everyday costs are even. The healthiest arrangement is the one you decide on together and revisit when incomes change.",
  },
  {
    q: "How do you talk about income with roommates without it being awkward?",
    a: "You don't necessarily need exact figures. Rough brackets or take-home ranges are usually enough to set proportions, and framing it as 'let's make sure rent doesn't crush anyone' keeps it collaborative rather than invasive. If someone would rather not share numbers at all, fall back to an even split with a comfort floor for the lower earner.",
  },
  {
    q: "What if our incomes change later?",
    a: "Treat the split as a living agreement, not a one-time decision. Agree to revisit it when someone gets a raise, changes jobs, or loses income — a quick check-in every few months, or whenever a lease renews, keeps the proportions fair as circumstances shift.",
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
        { "@type": "ListItem", position: 2, name: "Splitting bills with different incomes", item: `${SITE_URL}${PATH}` },
      ],
    },
  ],
};

export default function DifferentIncomesGuide() {
  return (
    <GuideShell slug={SLUG} jsonLd={JSON_LD}>
      <p className="text-sm font-medium text-primary">Guide</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        How to split bills when roommates earn different amounts
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        A 50/50 split feels fair until you realize it takes half of one
        person&apos;s paycheck and a tenth of another&apos;s. When incomes are
        genuinely far apart, splitting equally isn&apos;t always splitting
        fairly. Here&apos;s how to divide shared bills in proportion to income —
        with the formula, a worked example, and ways to keep the conversation
        comfortable.
      </p>

      <div className="mt-10 space-y-8">
        {APPROACHES.map((a, i) => (
          <section key={a.name}>
            <h2 className="flex items-baseline gap-2 text-xl font-bold">
              <span className="text-primary">{i + 1}.</span> {a.name}
            </h2>
            <p className="mt-2 text-muted-foreground">{a.text}</p>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">The formula</h2>
        <p className="mt-2 text-muted-foreground">
          For any shared bill, one person&apos;s fair share is:
        </p>
        <div className="mt-4 rounded-xl border bg-card p-5 text-center font-medium">
          your share = (your income ÷ total household income) × the bill
        </div>
        <p className="mt-4 text-muted-foreground">
          It works for a single bill or the whole month&apos;s shared spend —
          just plug in the right total.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">A worked example</h2>
        <p className="mt-2 text-muted-foreground">
          Three roommates take home <strong>$3,000</strong>,{" "}
          <strong>$2,000</strong>, and <strong>$1,000</strong> a month — a
          household total of $6,000. Their combined shared bills (rent,
          utilities, internet) come to <strong>$3,000</strong>. Proportional
          shares:
        </p>
        <ul className="mt-4 space-y-2 text-muted-foreground">
          <li>• Top earner: 3,000 ÷ 6,000 × $3,000 = <strong>$1,500</strong> (50%)</li>
          <li>• Middle earner: 2,000 ÷ 6,000 × $3,000 = <strong>$1,000</strong> (33%)</li>
          <li>• Lowest earner: 1,000 ÷ 6,000 × $3,000 = <strong>$500</strong> (17%)</li>
        </ul>
        <p className="mt-4 text-muted-foreground">
          Every roommate spends exactly half their take-home pay on shared
          bills — the load is identical relative to what each can afford, even
          though the dollar amounts are very different. Compare that to an even
          split ($1,000 each), which would eat the entire paycheck of the lowest
          earner.
        </p>
        <p className="mt-4 text-muted-foreground">
          You can model your own numbers in{" "}
          <Link href="/split-calculator" className="font-medium text-primary hover:underline">
            the free split calculator
          </Link>{" "}
          using its custom-amount mode.
        </p>
      </section>

      <section className="mt-12 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-bold">Set the percentages once, forget the math</h2>
        <p className="mt-2 text-muted-foreground">
          BillSpilt supports percentage splits, so you can lock in each
          person&apos;s income-based share and have every recurring bill divided
          that way automatically — with one running balance and a fewest-payments
          settle-up. Free forever, no paywall.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-95"
        >
          Split fairly — free <ArrowRight className="h-4 w-4" />
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
