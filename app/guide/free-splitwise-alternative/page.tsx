import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import {
  ArticleCta,
  ArticleHeader,
  ArticleSection,
  Bullet,
  BulletList,
  GuideShell,
  Paragraph,
  proseLink,
} from "@/components/guide-shell";
import { FaqSection } from "@/components/faq-section";
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
      <ArticleHeader eyebrow="Guide" title="The best free Splitwise alternative for roommates">
        If you&apos;ve bumped into limits or paywalls in another bill splitter,
        BillSpilt is a genuinely free alternative built for roommates — every
        feature included, no premium tier, no credit card.
      </ArticleHeader>

      <ArticleSection title="Everything included, free" className="mt-10 md:mt-12">
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {INCLUDED.map((t) => (
            <li key={t} className="flex min-h-14 items-center gap-3 px-4 py-3">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-positive-soft text-positive">
                <Check className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 text-base font-medium leading-snug">{t}</span>
            </li>
          ))}
        </ul>
      </ArticleSection>

      <ArticleSection title="What makes it a good switch">
        <Paragraph>
          BillSpilt focuses on the core job a roommate bill splitter needs to do
          and does it without nickel-and-diming: a smart settle-up that nets
          everyone&apos;s debts into the fewest payments, private per-person split
          breakdowns, multiple household admins, and offline support so you can
          log an expense on a plane. It&apos;s mobile-first and installs to your
          home screen — no app store, nothing to pay.
        </Paragraph>
      </ArticleSection>

      <ArticleSection title="What to look for in a free bill splitter">
        <Paragraph>
          &ldquo;Free&rdquo; means different things across bill-splitting apps.
          Some cap how many expenses you can add each month, some lock recurring
          bills or receipt scanning behind a subscription, and some show the
          balance but leave you to work out the actual payments. Before you
          commit a whole household to one, check the things that quietly matter:
        </Paragraph>
        <BulletList>
          <Bullet><strong>No expense or roommate caps</strong> — you shouldn&apos;t hit a wall mid-month.</Bullet>
          <Bullet><strong>A real settle-up</strong> that reduces everyone&apos;s debts to the fewest transfers, not just a running total.</Bullet>
          <Bullet><strong>Flexible splits</strong> — even, exact, and percentage — because not every bill divides the same way.</Bullet>
          <Bullet><strong>Recurring bills</strong> so rent and utilities log themselves.</Bullet>
          <Bullet><strong>Offline access</strong> for adding expenses without signal.</Bullet>
        </BulletList>
        <Paragraph>
          BillSpilt includes all of these at no cost. If you&apos;re coming from
          a paid tier elsewhere, you likely won&apos;t miss it — and you can
          sanity-check any split first with the{" "}
          <Link href="/split-calculator" className={proseLink}>
            free split calculator
          </Link>{" "}
          before you even make an account.
        </Paragraph>
      </ArticleSection>

      <FaqSection faq={FAQ} title="FAQ" />

      <ArticleCta title="Switch in under a minute" cta={<>Get started — it&apos;s free</>}>
        <Paragraph>
          Create your household, share a one-tap invite link, and start
          splitting. Free forever.
        </Paragraph>
      </ArticleCta>
    </GuideShell>
  );
}
