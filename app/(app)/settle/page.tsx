"use client";

import * as React from "react";
import {
  ArrowRight,
  PartyPopper,
  Loader2,
  Undo2,
  History,
  CheckCheck,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberAvatar } from "@/components/member-avatar";
import { useAppData } from "@/components/app-data";
import { useFetch } from "@/lib/use-fetch";
import { useToast } from "@/components/ui/toaster";
import { PaymentMethodsList } from "@/components/payment-methods-list";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_METHODS, type Balance, type SettlementTransfer } from "@/lib/types";

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
  const { version, mutate, currentUserId, isAdmin, members } = useAppData();
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
  const [settlingAll, setSettlingAll] = React.useState(false);

  const refetchHistory = history.refetch;
  React.useEffect(() => {
    void refetch();
    void refetchHistory();
  }, [version, refetch, refetchHistory]);

  // Surface transfers that involve the current user first.
  const transfers = React.useMemo(() => {
    const list = data?.transfers ?? [];
    const involvesMe = (t: SettlementTransfer) =>
      t.from === currentUserId || t.to === currentUserId;
    return [...list].sort(
      (a, b) => Number(involvesMe(b)) - Number(involvesMe(a)),
    );
  }, [data, currentUserId]);
  const settlements = history.data?.settlements ?? [];

  async function markAllPaid() {
    if (!window.confirm("Record every outstanding payment as settled? This clears all balances.")) {
      return;
    }
    setSettlingAll(true);
    try {
      const res = await fetch("/api/settle/all", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: body.error || "Could not settle everyone", variant: "error" });
        return;
      }
      toast({
        title: `Settled ${body.recorded} payment${body.recorded === 1 ? "" : "s"}`,
        variant: "success",
      });
      mutate();
      await Promise.all([refetch(), refetchHistory()]);
    } finally {
      setSettlingAll(false);
    }
  }

  async function shareReminder(t: SettlementTransfer) {
    const me = members.find((m) => m.id === t.to);
    const myMethods = me?.paymentMethods ?? [];
    const ways = myMethods
      .map((pm) => {
        const def = PAYMENT_METHODS.find((p) => p.value === pm.type);
        return `${def?.label ?? pm.type} ${pm.value}`;
      })
      .join(", ");
    const text =
      `Hey ${t.fromName}, friendly reminder you owe me ${formatCurrency(t.amount)} on Bill Split.` +
      (ways ? ` You can pay me with ${ways}.` : "");

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Bill Split reminder", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast({ title: "Reminder copied", description: "Paste it to send.", variant: "success" });
    } catch {
      /* user dismissed the share sheet, or clipboard unavailable */
    }
  }

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
    <div className="space-y-4 duration-500 animate-in fade-in slide-in-from-bottom-3">
      <div>
        <h1 className="text-lg font-bold">Settle up</h1>
        <p className="text-sm text-muted-foreground">
          The fewest payments to clear all debts.
        </p>
      </div>

      {isAdmin && transfers.length > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldCheck className="h-5 w-5 flex-shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Admin: settle everyone up</p>
              <p className="text-xs text-muted-foreground">
                Record all {transfers.length} payment
                {transfers.length === 1 ? "" : "s"} at once.
              </p>
            </div>
            <Button size="sm" onClick={markAllPaid} disabled={settlingAll}>
              {settlingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Mark all paid
            </Button>
          </CardContent>
        </Card>
      )}

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
            // When you're the payer, show the payee's ways to pay.
            const payee = members.find((m) => m.id === t.to);
            const showPay = t.from === currentUserId && (payee?.paymentMethods?.length ?? 0) > 0;
            const payerName = members.find((m) => m.id === t.from)?.name;
            const owedToYou = t.to === currentUserId;
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

                    {showPay && (
                      <div className="mt-3 rounded-lg bg-muted/60 p-3">
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Pay {t.toName} with
                        </p>
                        <PaymentMethodsList
                          methods={payee!.paymentMethods}
                          linkContext={{
                            amount: t.amount,
                            note: payerName
                              ? `Bill Split — from ${payerName}`
                              : "Bill Split",
                          }}
                        />
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      {owedToYou && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => shareReminder(t)}
                        >
                          <Bell className="h-4 w-4" />
                          Remind
                        </Button>
                      )}
                      <Button
                        variant="success"
                        className="flex-1"
                        onClick={() => markPaid(t)}
                        disabled={settling === key}
                      >
                        {settling === key && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Mark as paid
                      </Button>
                    </div>
                    <p className="mt-1.5 text-center text-xs text-muted-foreground">
                      Paid in cash or another way? Mark it as paid here too.
                    </p>
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
