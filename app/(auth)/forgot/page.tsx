"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, MailCheck, TriangleAlert } from "lucide-react";
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

type Result = "sent" | "unconfigured" | "error";

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
            : "error",
      );
    } catch {
      setResult("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8 flex justify-center">
        <Brand size="lg" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result === "sent" ? (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium">Check your email</p>
              <p className="mt-1 text-sm text-muted-foreground">
                If an account exists for that address, we&apos;ve sent a reset
                link. It expires in 1 hour.
              </p>
            </div>
          ) : result ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <TriangleAlert className="h-6 w-6 text-destructive" aria-hidden />
              </div>
              <p className="font-medium" role="alert">
                {result === "unconfigured"
                  ? "Reset emails aren't set up yet"
                  : "We couldn't send that reset link"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {result === "unconfigured"
                  ? "This deployment has no email provider configured, so no reset link can be sent. Contact the person who runs this site."
                  : "Something went wrong on our end. Please try again in a moment."}
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => setResult(null)}
              >
                Try again
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send reset link
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Back to log in
        </Link>
      </p>
    </>
  );
}
