import Link from "next/link";
import { MarketingHeader } from "@/components/marketing-header";
import { AdSenseScript } from "@/components/adsense-script";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
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
      <JsonLd data={jsonLd} />
      <AdSenseScript />
      <MarketingHeader />

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

      <SiteFooter />
    </div>
  );
}
