"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { Check, House, Loader2, LogOut, Megaphone, Users } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { useAppData } from "@/components/app-data";
import { AdsAdminSheet } from "@/components/ads-admin-sheet";
import { cn } from "@/lib/utils";

type Mode = "create" | "join";

const OPTIONS: {
  value: Mode;
  title: string;
  body: string;
  icon: typeof House;
}[] = [
  {
    value: "create",
    title: "Create a household",
    body: "Start fresh and invite your roommates.",
    icon: House,
  },
  {
    value: "join",
    title: "Join with a code",
    body: "A roommate already set one up.",
    icon: Users,
  },
];

/**
 * First-run gate: a user with no household either creates one (becoming owner
 * with an invite code) or joins an existing one via that code.
 */
export function HouseholdSetup() {
  const { refresh, isSiteAdmin } = useAppData();
  const [adsOpen, setAdsOpen] = React.useState(false);
  const { toast } = useToast();
  const [mode, setMode] = React.useState<Mode>("create");
  const [value, setValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body =
        mode === "create"
          ? { action: "create", name: value.trim() }
          : { action: "join", code: value.trim().toUpperCase() };
      const res = await fetch("/api/household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: data.error || "Something went wrong", variant: "error" });
        return;
      }
      toast({
        title: mode === "create" ? "Household created!" : "Joined household!",
        variant: "success",
      });
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background safe-top safe-bottom">
      {/* The app shell (and its account menu) isn't mounted until there's a
          household, so this screen carries its own way out. */}
      <header className="mx-auto flex h-16 w-full max-w-md items-center justify-between gap-2 px-gutter">
        <Brand size="md" />
        <Button
          variant="ghost"
          size="sm"
          className="-mr-2 text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut aria-hidden />
          Log out
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-gutter pb-8 pt-6 sm:justify-center sm:pb-16">
        <h1 className="text-3xl font-bold tracking-tight">
          Set up your household
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Bills are shared inside a household. Start one, or join your
          roommates with their invite code.
        </p>

        <div
          role="radiogroup"
          aria-label="How do you want to start?"
          className="mt-8 space-y-3"
        >
          {OPTIONS.map(({ value: option, title, body, icon: Icon }) => {
            const active = mode === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setMode(option);
                  setValue("");
                }}
                className={cn(
                  "flex min-h-[76px] w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left transition-[border-color,box-shadow,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary))]"
                    : "hover:bg-accent/60 active:bg-accent",
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold">{title}</span>
                  <span className="block text-sm text-muted-foreground">
                    {body}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input",
                  )}
                >
                  {active && <Check className="h-4 w-4" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>

        <form onSubmit={submit} className="mt-8 space-y-5" aria-busy={loading}>
          {mode === "create" ? (
            <div className="space-y-2">
              <Label htmlFor="hh">Household name</Label>
              <Input
                id="hh"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. Maple Street Flat"
                required
                maxLength={80}
                autoCapitalize="words"
                aria-describedby="hh-help"
              />
              <p id="hh-help" className="text-sm text-muted-foreground">
                You&apos;ll get a code to invite up to 12 roommates.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="code">Invite code</Label>
              <Input
                id="code"
                value={value}
                onChange={(e) => setValue(e.target.value.toUpperCase())}
                placeholder="ABC123"
                required
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-describedby="code-help"
                className="h-16 text-center font-mono text-2xl font-bold uppercase tracking-[0.3em] placeholder:font-semibold placeholder:text-muted-foreground/50"
              />
              <p id="code-help" className="text-sm text-muted-foreground">
                Ask a roommate — it&apos;s in their household settings. Got an
                invite link instead? Just open it.
              </p>
            </div>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading || !value.trim()}
          >
            {loading && <Loader2 className="animate-spin" aria-hidden />}
            {mode === "create" ? "Create household" : "Join household"}
          </Button>
        </form>

        {isSiteAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAdsOpen(true)}
            className="mx-auto mt-6 text-muted-foreground"
          >
            <Megaphone aria-hidden />
            Manage ads (operator)
          </Button>
        )}
      </main>

      <AdsAdminSheet open={adsOpen} onOpenChange={setAdsOpen} />
    </div>
  );
}
