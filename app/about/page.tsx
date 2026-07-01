import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Scale, Heart, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { AdSenseScript } from "@/components/adsense-script";
import { SiteFooter } from "@/components/site-footer";
import { SITE_URL, SITE_NAME } from "@/lib/site";

const TITLE = "About BillSpilt — the free roommate bill splitter";
const DESCRIPTION =
  "BillSpilt is a free bill splitter for roommates and shared households. Learn what it is, who it's for, how it stays free, and the principles behind it.";
const PATH = "/about";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { type: "website", url: `${SITE_URL}${PATH}`, title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: TITLE,
  url: `${SITE_URL}${PATH}`,
  description: DESCRIPTION,
  publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
};

const VALUES = [
  {
    icon: Scale,
    title: "Fair by default",
    body: "Money between roommates should be transparent and even-handed. Every split — evenly, by exact amount, or by percentage — is shown in full so nobody has to trust mental math.",
  },
  {
    icon: Heart,
    title: "Free forever, honestly",
    body: "There is no premium tier and no credit card. BillSpilt is supported by ads on our public pages, which is what lets every feature stay free for the people actually splitting bills.",
  },
  {
    icon: ShieldCheck,
    title: "Your money stays yours",
    body: "We never touch a cent. BillSpilt calculates who owes what and links you to Venmo or Cash App — the money always moves directly between you and your roommates.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <AdSenseScript />

      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 safe-top">
        <Link href="/" aria-label="BillSpilt home">
          <Brand size="sm" />
        </Link>
        <Link
          href="/register"
          className="flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground active:scale-95"
        >
          Get started
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-16 pt-6">
        <p className="text-sm font-medium text-primary">About</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          About BillSpilt
        </h1>

        <div className="mt-6 space-y-4 text-muted-foreground">
          <p>
            BillSpilt is a free bill splitter built for roommates and shared
            households. It exists to solve one specific, universally annoying
            problem: when several people share a home, the money gets tangled
            fast. Rent, internet, the electric bill, a grocery run, the shared
            streaming subscription — someone always covers something, and
            keeping track of who owes whom turns into group-chat math nobody
            enjoys.
          </p>
          <p>
            We built BillSpilt to make that math disappear. You log a shared
            expense in a few seconds — who paid, how much, how it&apos;s split,
            and who&apos;s included. From there the app keeps a running balance
            for every person in the household, so anyone can open it and see, at
            a glance, whether they&apos;re owed money or owe it. When it&apos;s
            time to square up, BillSpilt nets all the debts and works out the
            fewest possible payments that clear them — four roommates might
            settle everything with just two transfers instead of a dozen.
          </p>
          <p>
            The whole thing runs in your browser and installs to your home
            screen like a native app, so there&apos;s nothing to download from
            an app store. It even works offline: add an expense with no signal
            and it syncs automatically when you reconnect.
          </p>
        </div>

        <h2 className="mt-10 text-2xl font-bold">What we believe</h2>
        <div className="mt-6 space-y-6">
          {VALUES.map((v) => (
            <section key={v.title} className="flex gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <v.icon className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h3 className="font-semibold">{v.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.body}</p>
              </div>
            </section>
          ))}
        </div>

        <h2 className="mt-10 text-2xl font-bold">Who it&apos;s for</h2>
        <p className="mt-4 text-muted-foreground">
          BillSpilt is made for anyone sharing recurring costs: roommates in a
          house or apartment, couples splitting a household, friends on a group
          trip, or families dividing shared bills. If more than one person pays
          into the same pot, BillSpilt keeps it straight — for up to twelve
          people in a single household.
        </p>

        <h2 className="mt-10 text-2xl font-bold">How BillSpilt stays free</h2>
        <p className="mt-4 text-muted-foreground">
          Plenty of bill-splitting apps lock the useful parts — recurring bills,
          reminders, receipt photos, multiple admins — behind a subscription. We
          took the opposite approach: everything is free, and the site is
          supported by advertising on our public pages. That model is what lets
          us keep the app itself clean and every feature unlocked for the
          roommates who rely on it. We never hold or process your money, and we
          don&apos;t sell your data — see our{" "}
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>{" "}
          for exactly what we collect and why.
        </p>

        <section className="mt-12 rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-bold">Try it with your household</h2>
          <p className="mt-2 text-muted-foreground">
            Set up a household, invite your roommates with one link, and start
            splitting in minutes — free forever, no credit card.
          </p>
          <Link
            href="/register"
            className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-95"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Questions? Visit our{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              contact page
            </Link>
            .
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
