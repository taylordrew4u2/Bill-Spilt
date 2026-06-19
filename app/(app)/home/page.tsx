"use client";

import * as React from "react";
import { Copy, Check, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { NetSummary, BalanceRow } from "@/components/balance-card";
import { AdArea } from "@/components/ad-area";
import { useAppData } from "@/components/app-data";
import { useFetch } from "@/lib/use-fetch";
import { useToast } from "@/components/ui/toaster";
import type { Balance } from "@/lib/types";

export default function HomePage() {
  const { currentUserId, household, version } = useAppData();
  const { toast } = useToast();
  const { data, loading, refetch } = useFetch<{ balances: Balance[] }>(
    "/api/balances",
  );
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    void refetch();
  }, [version, refetch]);

  const balances = data?.balances ?? [];
  const mine = balances.find((b) => b.userId === currentUserId);

  async function copyCode() {
    if (!household) return;
    try {
      await navigator.clipboard.writeText(household.inviteCode);
      setCopied(true);
      toast({ title: "Invite code copied", variant: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: household.inviteCode, description: "Copy this code manually" });
    }
  }

  return (
    <div className="space-y-5 duration-500 animate-in fade-in slide-in-from-bottom-3">
      {loading && !data ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (
        <NetSummary net={mine?.net ?? 0} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Balances</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : balances.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No balances yet. Add your first expense with the + button.
            </p>
          ) : (
            <ul className="divide-y">
              {balances.map((b) => (
                <BalanceRow
                  key={b.userId}
                  balance={b}
                  isCurrentUser={b.userId === currentUserId}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {household && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-primary" />
              Invite roommates
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Share this code</p>
                <p className="text-2xl font-bold tracking-[0.25em]">
                  {household.inviteCode}
                </p>
              </div>
              <button
                onClick={copyCode}
                className="flex h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium active:scale-95"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <AdArea placement="home" />
    </div>
  );
}
