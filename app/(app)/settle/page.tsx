"use client";

import * as React from "react";
import { ArrowRight, PartyPopper, Loader2, Undo2, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberAvatar } from "@/components/member-avatar";
import { useAppData } from "@/components/app-data";
import { useFetch } from "@/lib/use-fetch";
import { useToast } from "@/components/ui/toaster";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Balance, SettlementTransfer } from "@/lib/types";

interface SettlementRecord {
  id: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
  settledAt: string;
}

export default function SettlePage() {
  const { version, mutate, currentUserId } = useAppData();
  const { toast } = useToast();
  const { data, loading, refetch } = useFetch<{
    balances: Balance[];
    transfers: SettlementTransfer[];
  }>("/api/settle");
  const history = useFetch<{ settlements: SettlementRecord[] }>(
    "/api/settlements",
  );
  const [settling, setSettling] = React.useState<string | null>(null);
  const [undoing, setUndoing] = React.useState<string | null>(null);

  const refetchHistory = history.refetch;
  React.useEffect(() => {
    void refetch();
    void refetchHistory();
  }, [version, refetch, refetchHistory]);

  const transfers = data?.transfers ?? [];
  const settlements = history.data?.settlements ?? [];

  async function undoSettlement(id: string) {
    setUndoing(id);
    try {
      const res = await fetch(`/api/settlements/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast({ title: "Could not undo", variant: "error" });
        return;
      }
      toast({ title: "Settlement undone", variant: "success" });
      mutate();
      await Promise.all([refetch(), refetchHistory()]);
    } finally {
      setUndoing(null);
    }
  }

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
      await Promise.all([refetch(), refetchHistory()]);
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

      {settlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-muted-foreground" />
              Settlement history
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {settlements.map((s) => (
                <li key={s.id} className="flex items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">
                      {s.from === currentUserId ? "You" : s.fromName}
                    </span>{" "}
                    paid{" "}
                    <span className="font-medium">
                      {s.to === currentUserId ? "you" : s.toName}
                    </span>
                    <span className="ml-1 text-muted-foreground">
                      · {formatDate(s.settledAt)}
                    </span>
                  </div>
                  <span className="font-semibold">{formatCurrency(s.amount)}</span>
                  <button
                    onClick={() => undoSettlement(s.id)}
                    disabled={undoing === s.id}
                    aria-label="Undo settlement"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    {undoing === s.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Undo2 className="h-4 w-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
