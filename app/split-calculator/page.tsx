import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, Scale } from "lucide-react";
import { Brand } from "@/components/brand";
import { SplitCalculator } from "@/components/split-calculator";
import { SiteFooter } from "@/components/site-footer";
import { SITE_URL } from "@/lib/site";

const TITLE = "Free Bill Split Calculator — Split a Bill by People & Tip | BillSpilt";
const DESCRIPTION =
  "Free bill split calculator — enter the total, the number of people, and an optional tip to see exactly what each person pays. No sign-up, works in your browser.";
const PATH = "/split-calculator";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { type: "website", url: `${SITE_URL}${PATH}`, title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Bill Split Calculator",
  url: `${SITE_URL}${PATH}`,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: DESCRIPTION,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function SplitCalculatorPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      {/* Nav — mirrors the landing header */}
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 safe-top">
        <Link href="/" aria-label="BillSpilt home">
          <Brand size="sm" />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="flex h-10 items-center rounded-md px-4 text-sm font-medium hover:bg-accent"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground active:scale-95"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16 pt-4">
        {/* Hero — same badge pill + primary accent as the landing */}
        <div className="mx-auto max-w-md text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            Free · No sign-up · Works in your browser
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Bill split calculator.
            <br />
            <span className="text-primary">Free, instant, no math.</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Enter the total, how many people, and an optional tip — or split it
            unevenly. We&apos;ll show exactly what each person owes.
          </p>
        </div>

        <div className="mt-8">
          <SplitCalculator />
        </div>

        {/* On-brand upsell card */}
        <section className="mx-auto mt-12 max-w-md rounded-2xl border bg-card p-6 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Scale className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-bold">
            Splitting with roommates regularly?
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            BillSpilt remembers every shared bill, tracks who owes what over
            time, and settles everyone up in the fewest payments — free forever.
          </p>
          <Link
            href="/register"
            className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-95"
          >
            Track it with your household <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            No credit card · No premium tier · Free forever
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
