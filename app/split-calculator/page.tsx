import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { SplitCalculator } from "@/components/split-calculator";
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
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 safe-top">
        <Link href="/">
          <Brand size="sm" />
        </Link>
        <Link
          href="/register"
          className="flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground active:scale-95"
        >
          Get started
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16 pt-4">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Bill split calculator
          </h1>
          <p className="mt-3 text-muted-foreground">
            Enter the total, how many people, and an optional tip. We&apos;ll
            show exactly what each person owes — no sign-up needed.
          </p>
        </div>

        <div className="mt-8">
          <SplitCalculator />
        </div>

        <section className="mx-auto mt-12 max-w-md rounded-2xl border bg-card p-6 text-center">
          <h2 className="text-lg font-bold">Splitting with roommates regularly?</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            BillSpilt remembers every shared bill, tracks who owes what over
            time, and settles everyone up in the fewest payments — free forever.
          </p>
          <Link
            href="/register"
            className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-95"
          >
            Track it with your household — free <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
