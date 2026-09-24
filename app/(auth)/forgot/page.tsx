"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, MailCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Result = "sent" | "unconfigured" | "provider-error" | "error";

/**
 * What to show when a reset link can't be sent. `unconfigured` and
 * `provider-error` are provider-level facts — the same for every address — which
 * is why the server can report them without revealing whether an address has an
 * account. The third case is our own bug and says so.
 */
const REASON = {
  unconfigured: {
    title: "Reset emails aren't set up yet",
    body: "This deployment has no email provider configured, so no reset link can be sent. Contact the person who runs this site.",
  },
  "provider-error": {
    title: "Our email provider is refusing us",
    body: "The mailbox this site sends from was rejected by the provider, so no reset link can be sent right now. Your password is fine — the mailer is not. Contact the person who runs this site.",
  },
  error: {
    title: "We couldn't send that reset link",
    body: "Something went wrong on our end. Please try again in a moment.",
  },
} as const;

/** The "Remembered it? Back to log in" row under each state. */
function BackToLogin() {
  return (
    <p className="mt-6 text-center text-base text-muted-foreground">
      Remembered it?{" "}
      <Link
        href="/login"
        className="inline-flex h-11 items-center rounded-lg px-0.5 font-semibold text-primary hover:underline"
      >
        Back to log in
      </Link>
    </p>
  );
}

export default function ForgotPage() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(form.get("email")).trim() }),
      });
      const body = await res.json().catch(() => ({}));
      // Only claim we sent something when the server says it could. Otherwise
      // this screen tells people to check an inbox no mail is coming to.
      setResult(
        res.ok && body?.delivery === "sent"
          ? "sent"
          : body?.delivery === "unconfigured"
            ? "unconfigured"
            : body?.delivery === "provider-error"
              ? "provider-error"
              : "error",
      );
    } catch {
      setResult("error");
    } finally {
      setLoading(false);
    }
  }

  // "sent" renders its own panel; anything else is a failure with a
  // provider-level explanation.
  const reason = result && result !== "sent" ? REASON[result] : null;

  if (result === "sent") {
    return (
      <div role="status">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
        <p className="mt-2 text-base text-muted-foreground">
          If an account exists for that address, we&apos;ve sent a reset link.
          It expires in 1 hour.
        </p>
        <Button asChild size="lg" className="mt-8 w-full">
          <Link href="/login">Back to log in</Link>
        </Button>
        <Button
          variant="ghost"
          className="mt-2 w-full text-primary hover:text-primary"
          onClick={() => setResult(null)}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  if (reason) {
    return (
      <>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <TriangleAlert className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold tracking-tight" role="alert">
          {reason.title}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">{reason.body}</p>
        <Button
          variant="outline"
          size="lg"
          className="mt-8 w-full"
          onClick={() => setResult(null)}
        >
          Try again
        </Button>
        <BackToLogin />
      </>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Reset your password
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5" aria-busy={loading}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" aria-hidden />}
          Send reset link
        </Button>
      </form>

      <BackToLogin />
    </>
  );
}
