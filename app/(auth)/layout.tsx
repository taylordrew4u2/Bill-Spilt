import Link from "next/link";
import { Brand } from "@/components/brand";

/**
 * Shell for the signed-out screens (log in, sign up, forgot / reset password).
 * On a phone the form sits straight on the page, edge to edge within the
 * gutter, the way native sign-in screens do — no small card floating in a
 * gradient. From `sm` up there's room to frame it as a centered card.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background safe-top safe-bottom">
      <header className="mx-auto flex h-16 w-full max-w-md items-center px-gutter sm:mt-6 sm:justify-center">
        <Link
          href="/"
          aria-label="BillSpilt home"
          className="-ml-1 flex h-11 items-center rounded-xl px-1 sm:ml-0"
        >
          <Brand size="md" />
        </Link>
      </header>

      <main className="flex flex-1 flex-col px-gutter pb-6 pt-6 sm:items-center sm:justify-center sm:pb-10 sm:pt-4">
        <div className="mx-auto w-full max-w-md sm:rounded-3xl sm:border sm:bg-card sm:p-8 sm:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.12)]">
          {children}
        </div>
      </main>

      <footer className="flex justify-center gap-2 px-gutter pb-3">
        <Link
          href="/privacy"
          className="inline-flex h-11 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Privacy Policy
        </Link>
        <Link
          href="/terms"
          className="inline-flex h-11 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Terms
        </Link>
      </footer>
    </div>
  );
}
