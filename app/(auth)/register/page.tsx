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

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // An invite link sends roommates here pre-bound to a household.
  const [invite, setInvite] = React.useState<{ code: string; house: string } | null>(
    null,
  );
  const loginHref = invite
    ? `/login?${new URLSearchParams({ invite: invite.code, house: invite.house })}`
    : "/login";

  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const code = q.get("invite");
    if (code) setInvite({ code, house: q.get("house") ?? "" });
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
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
      setLoading(false);
      return;
    }

    // Auto-login after successful registration.
    const login = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });
    if (login?.error) {
      setLoading(false);
      router.push(invite ? loginHref : "/login");
      return;
    }
    // Joined automatically when they arrived via an invite link — no tab to
    // pick, no code to type.
    if (invite) {
      await fetch("/api/household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", code: invite.code }),
      }).catch(() => {});
    }
    setLoading(false);
    router.push("/home");
    router.refresh();
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
          <CardTitle className="text-xl">
            {invite ? "Create your account to join" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {invite
              ? `You'll join ${invite.house || "your roommates"} the moment your account is ready.`
              : "Split bills with your roommates — free forever, no credit card."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Alex Doe" autoComplete="name" />
            </div>
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="At least 8 characters"
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {invite ? "Create account & join" : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={loginHref} className="font-semibold text-primary">
          Log in
        </Link>
      </p>
    </>
  );
}
