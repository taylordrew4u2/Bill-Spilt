import Link from "next/link";
import { Brand } from "@/components/brand";

/** The public-page header — brand, Log in, and a Get started CTA — shared by
 *  the landing page, the split calculator, About, Contact, and every /guide
 *  page. It stays pinned while you scroll (like the in-app top bar) so the
 *  sign-up button is always one tap away on a phone. */
export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-lg safe-top supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-gutter">
        {/* On the narrowest phones the wordmark gives way to the icon alone so
            both buttons keep a full-size tap target. */}
        <Link
          href="/"
          aria-label="BillSpilt home"
          className="-ml-1 flex h-11 min-w-0 items-center rounded-xl px-1 max-[359px]:[&_span]:sr-only"
        >
          <Brand size="sm" />
        </Link>
        <nav aria-label="Account" className="ml-auto flex flex-shrink-0 items-center gap-1">
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent active:bg-accent"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[background-color,transform] hover:bg-primary/90 active:scale-[0.98]"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
