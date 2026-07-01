"use client";

import * as React from "react";
import { Check, Users, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { NetSummary, BalanceRow } from "@/components/balance-card";
import { useAppData } from "@/components/app-data";
import { useFetch } from "@/lib/use-fetch";
import { useToast } from "@/components/ui/toaster";
import { shareInvite } from "@/lib/utils";
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

  async function share() {
    if (!household) return;
    const how = await shareInvite(household.inviteCode, household.name);
    if (how === "copied") {
      setCopied(true);
      toast({ title: "Invite link copied", variant: "success" });
      setTimeout(() => setCopied(false), 2000);
    } else if (how === "failed") {
      toast({ title: "Couldn't share the link", variant: "error" });
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
            <p className="text-sm text-muted-foreground">
              Send a link — they tap it, sign up, and they&apos;re in. No codes to
              type.
            </p>
            <button
              type="button"
              onClick={share}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Link copied
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" /> Share invite link
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Or share the code{" "}
              <span className="font-semibold tracking-[0.15em] text-foreground">
                {household.inviteCode}
              </span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
