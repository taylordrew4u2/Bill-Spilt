import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { AdSenseScript } from "@/components/adsense-script";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import { buttonVariants } from "@/components/ui/button";
import { GUIDES, guidePath } from "@/lib/guides";
import { cn } from "@/lib/utils";

/*
 * Long-form reading primitives shared by the guides, About, Contact, Privacy
 * and Terms. Body copy is 17px (19px on desktop) with relaxed leading in a
 * near-black, so an article reads comfortably on a phone without zooming;
 * the column is capped around 65 characters a line on wide screens.
 */

/** Body-copy classes for article paragraphs and list items. */
export const proseText =
  "text-base/relaxed text-foreground/85 md:text-lg/relaxed [&_strong]:font-semibold [&_strong]:text-foreground";

/** An inline link inside running text: underlined, since phones have no hover. */
export const proseLink =
  "font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary";

/** The reading column every content page sits in. */
export const articleColumn = "mx-auto w-full max-w-2xl px-gutter pb-14 pt-6 md:pb-20 md:pt-12";

/** Eyebrow pill, page title, and the standfirst paragraph under it. */
export function ArticleHeader({
  eyebrow,
  title,
  meta,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header>
      {eyebrow && (
        <p className="inline-flex h-8 items-center rounded-full bg-primary/10 px-3 text-sm font-semibold text-primary">
          {eyebrow}
        </p>
      )}
      <h1
        className={cn(
          "text-balance text-3xl font-bold tracking-tight md:text-4xl",
          eyebrow && "mt-3",
        )}
      >
        {title}
      </h1>
      {meta && <p className="mt-2 text-sm text-muted-foreground">{meta}</p>}
      {children && (
        <p className="mt-4 text-lg/relaxed text-muted-foreground md:text-xl/relaxed">
          {children}
        </p>
      )}
    </header>
  );
}

/** One body paragraph. */
export function Paragraph({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn(proseText, className)}>{children}</p>;
}

/** A titled article section; direct children are spaced as a text flow. */
export function ArticleSection({
  title,
  className,
  children,
}: {
  title: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("mt-12 md:mt-14", className)}>
      <h2 className="text-balance text-2xl font-bold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

/** A bulleted list with a hanging indent, so wrapped lines align. */
export function BulletList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <ul className={cn("space-y-3", className)}>{children}</ul>;
}

export function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className={cn("relative pl-6", proseText)}>
      <span
        aria-hidden
        className="absolute left-1 top-[0.6em] h-2 w-2 rounded-full bg-primary"
      />
      {children}
    </li>
  );
}

/**
 * The numbered methods/steps that open most guides. The number sits in a
 * badge beside the heading; the paragraph runs the full width underneath so
 * lines stay long enough to read on a 320px phone.
 */
export function NumberedSections({
  items,
  headingLevel = "h2",
  className,
}: {
  items: { name: string; text: string }[];
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const Heading = headingLevel;
  return (
    <div className={cn("space-y-9", className)}>
      {items.map((item, i) => (
        <section key={item.name}>
          <Heading className="flex items-start gap-3 text-xl font-bold leading-snug">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold tabular-nums text-primary-foreground">
              {i + 1}
              <span className="sr-only">.</span>
            </span>
            <span className="min-w-0 pt-px">{item.name}</span>
          </Heading>
          <p className={cn("mt-3", proseText)}>{item.text}</p>
        </section>
      ))}
    </div>
  );
}

/**
 * A worked-example calculation: one grouped card, one row per person, with
 * the label on its own line and the arithmetic below it in tabular figures so
 * the result never wraps away from its equation.
 */
export function CalcList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="divide-y overflow-hidden rounded-2xl border bg-card">{children}</ul>
  );
}

export function CalcRow({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="px-4 py-3">
      <span className="block text-base font-semibold">{label}</span>{" "}
      <span className="mt-0.5 block text-base tabular-nums text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground">
        {children}
      </span>
    </li>
  );
}

/**
 * The sign-up call to action that closes each content page: the app icon, a
 * short pitch, and one full-width primary button (it wraps rather than
 * overflowing on the narrowest phones).
 */
export function ArticleCta({
  title,
  cta,
  href = "/register",
  footnote,
  className,
  children,
}: {
  title: React.ReactNode;
  cta: React.ReactNode;
  href?: string;
  footnote?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "mt-12 rounded-2xl border bg-card p-5 shadow-sm md:mt-14 md:p-8",
        className,
      )}
    >
      <Image
        src="/icons/icon-192.png"
        alt=""
        aria-hidden
        width={48}
        height={48}
        className="rounded-xl shadow-sm"
      />
      <h2 className="mt-4 text-balance text-xl font-bold tracking-tight md:text-2xl">
        {title}
      </h2>
      {children && <div className="mt-2 space-y-4">{children}</div>}
      <Link
        href={href}
        className={cn(
          buttonVariants({ size: "lg" }),
          "mt-6 h-auto min-h-14 w-full whitespace-normal py-3 text-center md:w-auto md:px-8",
        )}
      >
        {/* The arrow rides inline after the last word, so a label that has
            to wrap on a small phone still reads as one centered phrase. */}
        <span className="text-balance">
          {cta}
          <ArrowRight aria-hidden className="ml-1.5 inline-block -translate-y-px align-middle" />
        </span>
      </Link>
      {footnote && <p className="mt-4 text-sm text-muted-foreground">{footnote}</p>}
    </section>
  );
}

/**
 * Shared chrome for /guide content pages: header, article wrapper, JSON-LD
 * injection, and a "related guides" cross-link block (good for SEO internal
 * linking and for keeping readers on-site).
 */
export function GuideShell({
  slug,
  jsonLd,
  children,
}: {
  slug: string;
  jsonLd: object;
  children: React.ReactNode;
}) {
  const related = GUIDES.filter((g) => g.slug !== slug).slice(0, 3);

  return (
    <div className="min-h-[100dvh] bg-background">
      <JsonLd data={jsonLd} />
      <AdSenseScript />
      <MarketingHeader />

      <article className={articleColumn}>{children}</article>

      {related.length > 0 && (
        <section aria-labelledby="more-guides" className="border-t py-10 md:py-12">
          <div className="mx-auto max-w-2xl px-gutter">
            <h2
              id="more-guides"
              className="mb-2 px-1 text-sm font-semibold text-muted-foreground"
            >
              More guides
            </h2>
            <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
              {related.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={guidePath(g.slug)}
                    className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-accent active:bg-accent"
                  >
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 text-base font-medium leading-snug">
                      {g.linkText}
                    </span>
                    <ChevronRight
                      className="h-5 w-5 flex-shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
