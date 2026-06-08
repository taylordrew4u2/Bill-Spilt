"use client";

import * as React from "react";
import { Loader2, Home, Users } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { useAppData } from "@/components/app-data";

type Mode = "create" | "join";

/**
 * First-run gate: a user with no household either creates one (becoming owner
 * with an invite code) or joins an existing one via that code.
 */
export function HouseholdSetup() {
  const { refresh } = useAppData();
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
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-5 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Brand size="lg" />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          <button
            onClick={() => {
              setMode("create");
              setValue("");
            }}
            className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition ${
              mode === "create" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Home className="h-4 w-4" /> Create
          </button>
          <button
            onClick={() => {
              setMode("join");
              setValue("");
            }}
            className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition ${
              mode === "join" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Users className="h-4 w-4" /> Join
          </button>
        </div>

        <Card>
          <CardContent className="pt-5">
            <form onSubmit={submit} className="space-y-4">
              {mode === "create" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="hh">Household name</Label>
                  <Input
                    id="hh"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. Maple Street Flat"
                    required
                    maxLength={80}
                  />
                  <p className="text-xs text-muted-foreground">
                    You&apos;ll get a code to invite up to 12 roommates.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="code">Invite code</Label>
                  <Input
                    id="code"
                    value={value}
                    onChange={(e) => setValue(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    required
                    autoCapitalize="characters"
                    className="text-center text-lg tracking-[0.3em]"
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading || !value.trim()}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create household" : "Join household"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
