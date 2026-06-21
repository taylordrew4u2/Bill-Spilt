import Link from "next/link";
import { Brand } from "@/components/brand";

export const metadata = {
  title: "Terms of Service",
};

const UPDATED = "June 20, 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto min-h-[100dvh] max-w-2xl px-5 py-10 safe-top safe-bottom">
      <Link href="/login" className="inline-block">
        <Brand size="sm" />
      </Link>

      <h1 className="mt-8 text-2xl font-bold">Terms of Service</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated {UPDATED}</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-foreground/90">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Using BILL SPILT</h2>
          <p>
            BILL SPILT is a free tool that helps roommates track shared expenses
            and settle up. By creating an account you agree to use it lawfully
            and to keep your login credentials secure. You&apos;re responsible
            for the accuracy of the expenses and balances you record.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Not a payment service</h2>
          <p>
            BILL SPILT helps you <em>calculate</em> who owes what — it does{" "}
            <strong>not</strong> process, hold, or transfer money. Actual
            payments happen directly between you and your roommates through
            whatever method you choose. We&apos;re not a party to those payments
            and aren&apos;t responsible for them.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Advertising</h2>
          <p>
            The app is supported by ads. See our{" "}
            <Link href="/privacy" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            for how cookies and advertising work.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">No warranty &amp; liability</h2>
          <p>
            The service is provided &ldquo;as is,&rdquo; without warranties of any
            kind. To the maximum extent permitted by law, we aren&apos;t liable
            for any indirect or consequential damages arising from your use of
            the app.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Contact</h2>
          <p>
            Questions about these terms? Email{" "}
            <a
              className="font-medium text-primary hover:underline"
              href="mailto:taylordrew4u@gmail.com"
            >
              taylordrew4u@gmail.com
            </a>
            .
          </p>
        </section>
      </div>

      <div className="mt-10 flex gap-4 text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          ← Back to app
        </Link>
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
