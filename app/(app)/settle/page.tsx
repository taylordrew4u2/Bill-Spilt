"use client";

import * as React from "react";
import { ArrowRight, PartyPopper, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberAvatar } from "@/components/member-avatar";
import { useAppData } from "@/components/app-data";
import { useFetch } from "@/lib/use-fetch";
import { useToast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/utils";
import type { Balance, SettlementTransfer } from "@/lib/types";

export default function SettlePage() {
  const { version, mutate, currentUserId } = useAppData();
  const { toast } = useToast();
  const { data, loading, refetch } = useFetch<{
    balances: Balance[];
    transfers: SettlementTransfer[];
  }>("/api/settle");
  const [settling, setSettling] = React.useState<string | null>(null);

  React.useEffect(() => {
    void refetch();
  }, [version, refetch]);

  const transfers = data?.transfers ?? [];

  async function markPaid(t: SettlementTransfer) {
    const key = `${t.from}-${t.to}-${t.amount}`;
    setSettling(key);
    try {
      const res = await fetch("/api/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: t.from, to: t.to, amount: t.amount }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast({ title: body.error || "Could not record payment", variant: "error" });
        return;
      }
      toast({ title: "Settled up!", variant: "success" });
      mutate();
      await refetch();
    } finally {
      setSettling(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Settle up</h1>
        <p className="text-sm text-muted-foreground">
          The fewest payments to clear all debts.
        </p>
      </div>

      {loading && !data ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : transfers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <PartyPopper className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="font-medium">Everyone&apos;s settled up</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No payments needed right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {transfers.map((t) => {
            const key = `${t.from}-${t.to}-${t.amount}`;
            const involvesYou = t.from === currentUserId || t.to === currentUserId;
            return (
              <li key={key}>
                <Card className={involvesYou ? "border-primary/40" : undefined}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <MemberAvatar id={t.from} name={t.fromName} className="h-8 w-8" />
                      <span className="text-sm font-medium">
                        {t.from === currentUserId ? "You" : t.fromName}
                      </span>
                      <ArrowRight className="mx-1 h-4 w-4 text-muted-foreground" />
                      <MemberAvatar id={t.to} name={t.toName} className="h-8 w-8" />
                      <span className="text-sm font-medium">
                        {t.to === currentUserId ? "You" : t.toName}
                      </span>
                      <span className="ml-auto text-lg font-bold text-primary">
                        {formatCurrency(t.amount)}
                      </span>
                    </div>
                    <Button
                      variant="success"
                      className="mt-3 w-full"
                      onClick={() => markPaid(t)}
                      disabled={settling === key}
                    >
                      {settling === key && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Mark as paid
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
