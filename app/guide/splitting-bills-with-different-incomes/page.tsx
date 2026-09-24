import type { Metadata } from "next";
import Link from "next/link";
import {
  ArticleCta,
  ArticleHeader,
  ArticleSection,
  CalcList,
  CalcRow,
  GuideShell,
  NumberedSections,
  Paragraph,
  proseLink,
} from "@/components/guide-shell";
import { FaqSection, faqJsonLd } from "@/components/faq-section";
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
    faqJsonLd(FAQ),
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
      <ArticleHeader
        eyebrow="Guide"
        title="How to split bills when roommates earn different amounts"
      >
        A 50/50 split feels fair until you realize it takes half of one
        person&apos;s paycheck and a tenth of another&apos;s. When incomes are
        genuinely far apart, splitting equally isn&apos;t always splitting
        fairly. Here&apos;s how to divide shared bills in proportion to income —
        with the formula, a worked example, and ways to keep the conversation
        comfortable.
      </ArticleHeader>

      <NumberedSections items={APPROACHES} className="mt-10" />

      <ArticleSection title="The formula">
        <Paragraph>
          For any shared bill, one person&apos;s fair share is:
        </Paragraph>
        <div className="text-balance rounded-2xl border border-primary/25 bg-primary/10 px-5 py-5 text-center text-lg font-semibold leading-snug text-foreground">
          your share = (your income ÷ total household income) × the bill
        </div>
        <Paragraph>
          It works for a single bill or the whole month&apos;s shared spend —
          just plug in the right total.
        </Paragraph>
      </ArticleSection>

      <ArticleSection title="A worked example">
        <Paragraph>
          Three roommates take home <strong>$3,000</strong>,{" "}
          <strong>$2,000</strong>, and <strong>$1,000</strong> a month — a
          household total of $6,000. Their combined shared bills (rent,
          utilities, internet) come to <strong>$3,000</strong>. Proportional
          shares:
        </Paragraph>
        <CalcList>
          <CalcRow label="Top earner:">3,000 ÷ 6,000 × $3,000 = <strong>$1,500</strong> (50%)</CalcRow>
          <CalcRow label="Middle earner:">2,000 ÷ 6,000 × $3,000 = <strong>$1,000</strong> (33%)</CalcRow>
          <CalcRow label="Lowest earner:">1,000 ÷ 6,000 × $3,000 = <strong>$500</strong> (17%)</CalcRow>
        </CalcList>
        <Paragraph>
          Every roommate spends exactly half their take-home pay on shared
          bills — the load is identical relative to what each can afford, even
          though the dollar amounts are very different. Compare that to an even
          split ($1,000 each), which would eat the entire paycheck of the lowest
          earner.
        </Paragraph>
        <Paragraph>
          You can model your own numbers in{" "}
          <Link href="/split-calculator" className={proseLink}>
            the free split calculator
          </Link>{" "}
          using its custom-amount mode.
        </Paragraph>
      </ArticleSection>

      <ArticleCta title="Set the percentages once, forget the math" cta="Split fairly — free">
        <Paragraph>
          BillSpilt supports percentage splits, so you can lock in each
          person&apos;s income-based share and have every recurring bill divided
          that way automatically — with one running balance and a fewest-payments
          settle-up. Free forever, no paywall.
        </Paragraph>
      </ArticleCta>

      <FaqSection faq={FAQ} />
    </GuideShell>
  );
}
