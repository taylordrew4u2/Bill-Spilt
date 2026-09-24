"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  Link2Off,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Password field with a 44px show/hide toggle inside its right edge. */
function PasswordInput(
  props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">,
) {
  const [shown, setShown] = React.useState(false);
  return (
    <div className="relative">
      <Input {...props} type={shown ? "text" : "password"} className="pr-14" />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        aria-controls={props.id}
        className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {shown ? (
          <EyeOff className="h-5 w-5" aria-hidden />
        ) : (
          <Eye className="h-5 w-5" aria-hidden />
        )}
      </button>
    </div>
  );
}

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const confirm = String(form.get("confirm"));
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Could not reset password");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1800);
  }

  if (!token) {
    return (
      <>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <Link2Off className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Invalid link</h1>
        <p className="mt-2 text-base text-muted-foreground">
          This reset link is missing or malformed.
        </p>
        <Button asChild size="lg" className="mt-8 w-full">
          <Link href="/forgot">Request a new link</Link>
        </Button>
      </>
    );
  }

  if (done) {
    return (
      <div role="status">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Password updated</h1>
        <p className="mt-2 flex items-center gap-2 text-base text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Redirecting you to log in…
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Set a new password
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Choose a new password for your account.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5" aria-busy={loading}>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordInput
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Re-enter password"
          />
        </div>
        {error && (
          <div
            role="alert"
            className="flex gap-2.5 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
          >
            <CircleAlert className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
            <p>{error}</p>
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" aria-hidden />}
          Update password
        </Button>
      </form>

      <p className="mt-6 text-center text-base text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/login"
          className="inline-flex h-11 items-center rounded-lg px-1 font-semibold text-primary hover:underline"
        >
          Back to log in
        </Link>
      </p>
    </>
  );
}

export default function ResetPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2
            className="h-7 w-7 animate-spin text-muted-foreground"
            aria-label="Loading"
          />
        </div>
      }
    >
      <ResetForm />
    </React.Suspense>
  );
}
