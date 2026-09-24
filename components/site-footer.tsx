import Link from "next/link";
import { Brand } from "@/components/brand";
import { GUIDES, guidePath } from "@/lib/guides";

const PRODUCT_LINKS = [
  { href: "/", label: "Home" },
  { href: "/split-calculator", label: "Bill split calculator" },
  { href: "/register", label: "Get started" },
  { href: "/login", label: "Log in" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

/** One column of footer links. Every link is a full-height (44px) block so
 *  it's an easy thumb target, not a sliver of text. */
function FooterNav({
  label,
  links,
  className,
}: {
  label: string;
  links: { href: string; label: string }[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <ul className="mt-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="-mx-2 flex min-h-11 items-center rounded-lg px-2 py-2 text-sm leading-snug text-muted-foreground transition-colors hover:text-foreground active:bg-accent"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Shared footer for the public marketing/content pages (landing, calculator,
 * guides, About, Contact). Keeps navigation, legal links, and the brand
 * consistent — and surfaces About/Contact, which AdSense expects every site to
 * have.
 */
export function SiteFooter() {
  return (
    <footer className="border-t bg-card safe-bottom">
      <div className="mx-auto max-w-5xl px-gutter pb-8 pt-10 md:pt-12">
        {/* Phones: brand, then Product + Company side by side (short labels),
            then Guides full width (long labels). Desktop: four columns. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-[1.3fr_1fr_1.3fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Brand size="sm" />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              The free roommate bill splitter — split shared costs, see who owes
              what, and settle up in the fewest payments.
            </p>
          </div>

          <FooterNav label="Product" links={PRODUCT_LINKS} />

          <FooterNav
            label="Guides"
            className="order-last col-span-2 md:order-none md:col-span-1"
            links={GUIDES.slice(0, 4).map((g) => ({
              href: guidePath(g.slug),
              label: g.linkText,
            }))}
          />

          <FooterNav label="Company" links={COMPANY_LINKS} />
        </div>

        <p className="mt-10 border-t pt-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} BillSpilt. Made for roommates who&apos;d
          rather not argue about money.
        </p>
      </div>
    </footer>
  );
}
