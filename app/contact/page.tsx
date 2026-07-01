import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircleQuestion, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { AdSenseScript } from "@/components/adsense-script";
import { SiteFooter } from "@/components/site-footer";
import { SITE_URL, SITE_NAME } from "@/lib/site";

const TITLE = "Contact BillSpilt — support & feedback";
const DESCRIPTION =
  "Get in touch with the BillSpilt team. Email us for support, feedback, privacy questions, or anything about the free roommate bill splitter.";
const PATH = "/contact";
const SUPPORT_EMAIL = "taylordrew4u@gmail.com";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { type: "website", url: `${SITE_URL}${PATH}`, title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: TITLE,
  url: `${SITE_URL}${PATH}`,
  description: DESCRIPTION,
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    email: SUPPORT_EMAIL,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SUPPORT_EMAIL,
      availableLanguage: "English",
    },
  },
};

const REASONS = [
  {
    icon: MessageCircleQuestion,
    title: "Support & feedback",
    body: "Hit a bug, have a question about splitting or settling up, or an idea to make BillSpilt better? We read every message.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy & your data",
    body: "Want to access, correct, or delete your account and its data? Email us and we'll take care of it. Details are in our Privacy Policy.",
  },
];

export default function ContactPage() {
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
        <p className="text-sm font-medium text-primary">Contact</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Get in touch
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          BillSpilt is made by a small team who actually split bills with
          roommates. Email is the fastest way to reach us — we typically reply
          within a couple of business days.
        </p>

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-8 flex items-center gap-3 rounded-2xl border bg-card p-5 transition-colors hover:bg-accent"
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mail className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email us</p>
            <p className="text-lg font-semibold">{SUPPORT_EMAIL}</p>
          </div>
        </a>

        <div className="mt-8 space-y-6">
          {REASONS.map((r) => (
            <section key={r.title} className="flex gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <r.icon className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h2 className="font-semibold">{r.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Looking for how BillSpilt works or who we are? Read{" "}
          <Link href="/about" className="font-medium text-primary hover:underline">
            about BillSpilt
          </Link>
          , or see our{" "}
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Terms
          </Link>
          .
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
