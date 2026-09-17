"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useInvite, acceptInvite } from "@/lib/use-invite";

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
      <div className="mb-8 flex flex-col items-center gap-1.5">
        <Brand size="lg" />
        <p className="text-sm font-medium text-muted-foreground">
          Split bills with your roommates
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            {invite
              ? `Log in to join ${invite.householdName || "your roommates"}.`
              : "Log in to split bills with your roommates."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" aria-busy={loading}>
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Log in
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href={withInvite("/register")} className="font-semibold text-primary">
          Create an account
        </Link>
      </p>
    </>
  );
}
