import Link from "next/link";
import { Brand } from "@/components/brand";

export const metadata = {
  title: "Privacy Policy",
};

const UPDATED = "June 20, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-[100dvh] max-w-2xl px-5 py-10 safe-top safe-bottom">
      <Link href="/login" className="inline-block">
        <Brand size="sm" />
      </Link>

      <h1 className="mt-8 text-2xl font-bold">Privacy Policy</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated {UPDATED}</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-foreground/90">
        <section className="space-y-2">
          <p>
            BILL SPILT (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a bill-splitting
            app for roommates available at billspilt.com. This policy explains
            what we collect, how we use it, and the third parties involved —
            including how cookies are used to serve ads.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Information we collect</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Account info</strong> — your name and email, and a securely
              hashed password (we never store your raw password).
            </li>
            <li>
              <strong>App data you enter</strong> — households, expenses, splits,
              settlements, recurring bills, optional receipt photos, and the
              payment handles (e.g. Venmo, Cash App) you choose to share.
            </li>
            <li>
              <strong>Technical data</strong> — standard log/usage data and
              identifiers (such as IP address and cookies) collected when you use
              the app, including by the third parties below.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">How we use it</h2>
          <p>
            To provide the service (accounts, balances, settle-up, reminders,
            recurring bills), to keep it secure, and to display advertising that
            helps keep the app free.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Cookies &amp; advertising</h2>
          <p>
            We use a cookie to keep you signed in. We also use{" "}
            <strong>Google AdSense</strong> to show ads. Third-party vendors,
            including Google, use cookies to serve ads based on your prior visits
            to this and other websites.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Google&apos;s use of advertising cookies enables it and its
              partners to serve ads to you based on your visits to our site
              and/or other sites on the Internet.
            </li>
            <li>
              You can opt out of personalized advertising by visiting{" "}
              <a
                className="font-medium text-primary hover:underline"
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ads Settings
              </a>
              , or opt out of some third-party vendors at{" "}
              <a
                className="font-medium text-primary hover:underline"
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
              >
                aboutads.info
              </a>
              .
            </li>
            <li>
              Learn how Google uses information from sites that use its services:{" "}
              <a
                className="font-medium text-primary hover:underline"
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
              >
                How Google uses data
              </a>
              .
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Service providers</h2>
          <p>
            We rely on trusted infrastructure providers to run the app:{" "}
            <strong>Vercel</strong> (hosting), our managed{" "}
            <strong>Postgres database</strong> (data storage),{" "}
            <strong>Vercel Blob</strong> (receipt photos),{" "}
            <strong>Google AdSense</strong> (advertising), and an email provider
            (<strong>Resend</strong> or SMTP) for transactional emails such as
            password resets.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Your choices &amp; rights</h2>
          <p>
            You can edit your profile, leave a household, and request deletion of
            your account and associated data by contacting us. To exercise any
            data rights, email{" "}
            <a
              className="font-medium text-primary hover:underline"
              href="mailto:taylordrew4u@gmail.com"
            >
              taylordrew4u@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Children</h2>
          <p>
            BILL SPILT is not directed to children under 13, and we do not
            knowingly collect personal information from them.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Changes &amp; contact</h2>
          <p>
            We may update this policy; material changes will be reflected by the
            &ldquo;last updated&rdquo; date above. Questions? Email{" "}
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
        <Link href="/terms" className="hover:underline">
          Terms of Service
        </Link>
      </div>
    </div>
  );
}
