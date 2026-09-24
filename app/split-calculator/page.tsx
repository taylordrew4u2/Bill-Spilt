import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing-header";
import { SplitCalculator } from "@/components/split-calculator";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
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
      <JsonLd data={JSON_LD} />

      {/* Nav — the same header as the landing page */}
      <MarketingHeader />

      <main className="relative isolate">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
        />
        <div className="mx-auto max-w-3xl px-gutter pb-14 pt-8 sm:pb-20 sm:pt-14">
          {/* Hero — same primary accent + check-mark promises as the landing */}
          <div className="mx-auto max-w-md text-center">
            <h1 className="text-balance text-3xl font-bold leading-[1.12] tracking-tight sm:text-5xl sm:leading-[1.08]">
              Bill split calculator.
              <br />
              <span className="text-primary">Free, instant, no math.</span>
            </h1>
            <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
              Enter the total, how many people, and an optional tip — or split it
              unevenly. We&apos;ll show exactly what each person owes.
            </p>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm font-medium text-muted-foreground"
            >
              {["Free", "No sign-up", "Works in your browser"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-positive" strokeWidth={2.6} aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <SplitCalculator />
          </div>

          {/* On-brand upsell card */}
          <section className="mx-auto mt-10 max-w-md rounded-2xl border bg-card p-6 text-center shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:mt-14 sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Scale className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="mt-4 text-balance text-xl font-bold">
              Splitting with roommates regularly?
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-pretty text-base text-muted-foreground">
              BillSpilt remembers every shared bill, tracks who owes what over
              time, and settles everyone up in the fewest payments — free forever.
            </p>
            <Button asChild size="lg" className="mt-6 w-full">
              <Link href="/register">
                Track it with your household <ArrowRight aria-hidden />
              </Link>
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">No credit card</span> ·{" "}
              <span className="whitespace-nowrap">No premium tier</span> ·{" "}
              <span className="whitespace-nowrap">Free forever</span>
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
