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

export default function LoginPage() {
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
      let res;
      try {
        res = await signIn("credentials", {
          email: String(form.get("email")).trim(),
          password: String(form.get("password")),
          redirect: false,
        });
      } catch {
        setError(
          "We couldn't reach the server. Check your connection and try again.",
        );
        return;
      }
      if (res?.error) {
        // `CredentialsSignin` is the only code that means "wrong email or
        // password". Anything else is a server-side problem (database down,
        // AUTH_SECRET missing…) and saying "incorrect password" for those
        // sends people off resetting a password that was never wrong.
        setError(
          res.error === "CredentialsSignin"
            ? "Incorrect email or password"
            : "Something went wrong signing you in — this is on our end, not your password. Please try again in a moment.",
        );
        return;
      }
      // Followed an invite link → join the household once logged in.
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
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-base text-muted-foreground">
          {invite
            ? `Log in to join ${invite.householdName || "your roommates"}.`
            : "Log in to split bills with your roommates."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5" aria-busy={loading}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot"
              className="-my-2 -mr-2 inline-flex h-11 items-center rounded-lg px-2 text-sm font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="Your password"
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
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-base text-muted-foreground">
        New here?{" "}
        <Link
          href={withInvite("/register")}
          className="inline-flex h-11 items-center rounded-lg px-0.5 font-semibold text-primary hover:underline"
        >
          Create an account
        </Link>
      </p>
    </>
  );
}
