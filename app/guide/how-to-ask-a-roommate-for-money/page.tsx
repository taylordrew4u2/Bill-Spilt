import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GuideShell } from "@/components/guide-shell";
import { SITE_URL } from "@/lib/site";

const SLUG = "how-to-ask-a-roommate-for-money";
const TITLE = "How to Ask a Roommate for Money They Owe You";
const DESCRIPTION =
  "Asking a roommate for money owed without making it weird: keep the receipts, be specific, give them an easy way to pay, and let a shared balance do the awkward part for you.";
const PATH = `/guide/${SLUG}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { type: "article", url: `${SITE_URL}${PATH}`, title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const TIPS = [
  {
    name: "Have the receipts before you ask",
    text: "The conversation goes sideways when it's your memory against theirs. Track shared expenses as they happen so 'you owe me $40' becomes 'here's the $80 grocery run on the 3rd, split between us.' Specifics turn a confrontation into a quick confirmation.",
  },
  {
    name: "Ask early, ask small, ask often",
    text: "Don't let a $15 here and $20 there pile into an awkward $200 ask three months later. Settling up regularly keeps each amount small and normal, so nobody feels cornered and the friendship never carries a big invisible IOU.",
  },
  {
    name: "Be direct and kind — and pick the right channel",
    text: "A friendly, specific text beats a passive-aggressive sticky note or a tense in-person ambush. Something like: 'Hey! Settled up the utilities — you're at $32 for this month, no rush. Venmo or Cash App whenever.' Warm, exact, and easy to act on.",
  },
  {
    name: "Make paying frictionless",
    text: "People pay back faster when it takes one tap. Share your Venmo or Cash App handle and ideally a pre-filled amount, so 'I'll get you later' doesn't become next month. Remove every reason to put it off.",
  },
  {
    name: "Let the app be the bad guy",
    text: "The least awkward ask is the one you don't have to make. When a shared balance is right there for everyone to see, the number does the talking — and a friendly automated reminder nudges a roommate without you having to chase them at all.",
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
        { "@type": "ListItem", position: 1, name: "BillSpilt", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "How to ask a roommate for money owed", item: `${SITE_URL}${PATH}` },
      ],
    },
  ],
};

export default function AskRoommateGuide() {
  return (
    <GuideShell slug={SLUG} jsonLd={JSON_LD}>
      <p className="text-sm font-medium text-primary">Guide</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        How to ask a roommate for money they owe you
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Chasing a roommate for money is the fastest way to make home feel
        uncomfortable. The trick is to make the ask small, specific, and
        friction-free — or to avoid having to ask at all.
      </p>

      <div className="mt-10 space-y-8">
        {TIPS.map((t, i) => (
          <section key={t.name}>
            <h2 className="flex items-baseline gap-2 text-xl font-bold">
              <span className="text-primary">{i + 1}.</span> {t.name}
            </h2>
            <p className="mt-2 text-muted-foreground">{t.text}</p>
          </section>
        ))}
      </div>

      <section className="mt-12 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-bold">Never have the awkward conversation again</h2>
        <p className="mt-2 text-muted-foreground">
          BillSpilt keeps a live balance of who owes what, links roommates
          straight to Venmo or Cash App with the amount ready, and sends a
          friendly pre-written reminder in one tap — so the math does the asking
          for you. Free forever, no paywall.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-95"
        >
          Get everyone squared up — free <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </GuideShell>
  );
}
