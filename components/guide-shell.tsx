import Link from "next/link";
import { Brand } from "@/components/brand";
import { GUIDES, guidePath } from "@/lib/guides";

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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

      <article className="mx-auto max-w-2xl px-5 pb-16 pt-6">{children}</article>

      {related.length > 0 && (
        <section className="border-t bg-card/40 py-10">
          <div className="mx-auto max-w-2xl px-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              More guides
            </h2>
            <ul className="mt-3 space-y-2">
              {related.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={guidePath(g.slug)}
                    className="font-medium text-primary hover:underline"
                  >
                    {g.linkText} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
