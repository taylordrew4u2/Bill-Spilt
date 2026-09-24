"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { CircleAlert, Eye, EyeOff, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInvite, acceptInvite } from "@/lib/use-invite";

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

export default function RegisterPage() {
  const router = useRouter();
  const { invite, withInvite } = useInvite();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      const payload = {
        name: String(form.get("name")),
        email: String(form.get("email")),
        password: String(form.get("password")),
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Could not create account");
        return;
      }

      // Auto-login after registration; on failure fall back to the log-in page
      // (preserving the invite so they still land in the right household).
      const login = await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        redirect: false,
      });
      if (login?.error) {
        router.push(withInvite("/login"));
        return;
      }

      // Arrived via an invite link → join automatically, no code to type.
      if (invite) await acceptInvite(invite.code);
      router.push("/home");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        {invite && (
          <p className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
            <Users className="h-4 w-4 flex-shrink-0" aria-hidden />
            <span className="truncate">
              {invite.householdName
                ? `Invited to ${invite.householdName}`
                : "You've been invited"}
            </span>
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight">
          {invite ? "Create your account to join" : "Create your account"}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {invite
            ? `You'll join ${invite.householdName || "your roommates"} the moment your account is ready.`
            : "Split bills with your roommates — free forever, no credit card."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5" aria-busy={loading}>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Alex Doe"
            autoComplete="name"
            autoCapitalize="words"
          />
        </div>
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
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
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
          {invite ? "Create account & join" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-base text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={withInvite("/login")}
          className="inline-flex h-11 items-center rounded-lg px-1 font-semibold text-primary hover:underline"
        >
          Log in
        </Link>
      </p>
    </>
  );
}
