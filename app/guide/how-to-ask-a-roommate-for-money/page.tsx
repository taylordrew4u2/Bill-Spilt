import type { Metadata } from "next";
import {
  ArticleCta,
  ArticleHeader,
  ArticleSection,
  GuideShell,
  NumberedSections,
  Paragraph,
} from "@/components/guide-shell";
import { FaqSection, faqJsonLd } from "@/components/faq-section";
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

const TEMPLATES = [
  {
    label: "The regular monthly nudge",
    text: "Hey! Just settled up this month's bills — you're at $42 (electric + your half of groceries). No rush, Venmo or Cash App whenever works. 🙂",
  },
  {
    label: "The first, gentle reminder",
    text: "Hey, quick one — you're at $60 from the internet and last week's grocery run. Can you send it over when you get a sec? Happy to share the receipts if useful.",
  },
  {
    label: "The follow-up (a week later)",
    text: "Hi! Circling back on the $60 from earlier — just want to keep us square before this month's bills land. Could you send it by the weekend?",
  },
  {
    label: "The bigger, upfront ask",
    text: "Before I book the internet install, it's $90 each up front. Can you send your share this week so I can lock it in? I'll drop the confirmation in the group chat once it's done.",
  },
];

const FAQ = [
  {
    q: "How do I ask my roommate for money without it being awkward?",
    a: "Keep it specific, small, and easy to act on. Reference the exact expenses and the exact amount ('$42 for electric and your half of groceries'), ask early before it grows, and give them a one-tap way to pay like a Venmo or Cash App link. A friendly, factual text lands far better than a passive-aggressive note or an in-person ambush.",
  },
  {
    q: "What do I do if my roommate keeps 'forgetting' to pay me back?",
    a: "Remove the ambiguity first — a shared running balance everyone can see makes 'I forgot' much harder. Send a specific reminder referencing the amount and what it's for. If it's a pattern, stop fronting their share: put big bills in their name, or ask for their portion up front before you pay for shared purchases.",
  },
  {
    q: "Should I charge a roommate interest or a late fee for money owed?",
    a: "For everyday shared bills between friends, no — it usually causes more friction than it's worth and can damage the relationship. The better lever is frequency: settle up monthly so no single amount ever gets large enough to need a late fee. Reserve formal terms for genuinely large, one-off shared purchases, and agree them in writing beforehand.",
  },
  {
    q: "How often should I ask roommates to settle up?",
    a: "Monthly is ideal. It keeps each person's balance small and predictable, lines up with rent and utility cycles, and normalizes the ask so it never feels like a confrontation. Weekly can feel like nagging; letting it run for months lets balances grow into tense, hard-to-pay sums.",
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
        { "@type": "ListItem", position: 2, name: "How to ask a roommate for money owed", item: `${SITE_URL}${PATH}` },
      ],
    },
  ],
};

export default function AskRoommateGuide() {
  return (
    <GuideShell slug={SLUG} jsonLd={JSON_LD}>
      <ArticleHeader eyebrow="Guide" title="How to ask a roommate for money they owe you">
        Chasing a roommate for money is the fastest way to make home feel
        uncomfortable. The trick is to make the ask small, specific, and
        friction-free — or to avoid having to ask at all.
      </ArticleHeader>

      <NumberedSections items={TIPS} className="mt-10" />

      <ArticleSection title="Copy-paste message templates">
        <Paragraph>
          The hardest part is often just wording it. Steal one of these,
          swap in the amount, and send:
        </Paragraph>
        {/* Each template reads like the text it will become: a label, then
            the message in a chat bubble. */}
        <div className="space-y-3">
          {TEMPLATES.map((t) => (
            <div key={t.label} className="rounded-2xl border bg-card p-4">
              <p className="text-sm font-semibold text-primary">{t.label}</p>
              <p className="mt-2 rounded-2xl rounded-tl-md bg-primary/10 px-4 py-3 text-base/relaxed text-foreground">
                &ldquo;{t.text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </ArticleSection>

      <FaqSection faq={FAQ} />

      <ArticleCta
        title="Never have the awkward conversation again"
        cta="Get everyone squared up — free"
      >
        <Paragraph>
          BillSpilt keeps a live balance of who owes what, links roommates
          straight to Venmo or Cash App with the amount ready, and sends a
          friendly pre-written reminder in one tap — so the math does the asking
          for you. Free forever, no paywall.
        </Paragraph>
      </ArticleCta>
    </GuideShell>
  );
}
