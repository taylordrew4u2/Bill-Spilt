import Link from "next/link";
import { Brand } from "@/components/brand";

/** The simple public-page header — brand + a Get started CTA — shared by
 *  About, Contact, and every /guide page. */
export function MarketingHeader() {
  return (
    <header className="mx-auto flex max-w-3xl items-center justify-between px-gutter py-4 safe-top">
      <Link href="/" aria-label="BillSpilt home">
        <Brand size="sm" />
      </Link>
      <Link
        href="/register"
        className="flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground active:scale-95"
      >
        Get started
      </Link>
    </header>
  );
}
