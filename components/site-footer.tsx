import Link from "next/link";
import { Brand } from "@/components/brand";
import { GUIDES, guidePath } from "@/lib/guides";

/**
 * Shared footer for the public marketing/content pages (landing, calculator,
 * guides, About, Contact). Keeps navigation, legal links, and the brand
 * consistent — and surfaces About/Contact, which AdSense expects every site to
 * have.
 */
export function SiteFooter() {
  return (
    <footer className="border-t bg-card/40 safe-bottom">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="grid gap-8 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <Brand size="sm" />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              The free roommate bill splitter — split shared costs, see who owes
              what, and settle up in the fewest payments.
            </p>
          </div>

          <nav aria-label="Product" className="text-sm">
            <p className="font-semibold">Product</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground">Home</Link></li>
              <li><Link href="/split-calculator" className="hover:text-foreground">Bill split calculator</Link></li>
              <li><Link href="/register" className="hover:text-foreground">Get started</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Log in</Link></li>
            </ul>
          </nav>

          <nav aria-label="Guides" className="text-sm">
            <p className="font-semibold">Guides</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              {GUIDES.slice(0, 4).map((g) => (
                <li key={g.slug}>
                  <Link href={guidePath(g.slug)} className="hover:text-foreground">
                    {g.linkText}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company" className="text-sm">
            <p className="font-semibold">Company</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
            </ul>
          </nav>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          © {new Date().getFullYear()} BillSpilt. Made for roommates who&apos;d
          rather not argue about money.
        </p>
      </div>
    </footer>
  );
}
