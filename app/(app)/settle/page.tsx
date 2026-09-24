"use client";

import * as React from "react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  Loader2,
  PartyPopper,
  Plus,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { MemberAvatar } from "@/components/member-avatar";
import { useAppData, useMoney } from "@/components/app-data";
import { useAddExpense } from "@/components/add-expense-sheet";
import { useFetch } from "@/lib/use-fetch";
import { useToast } from "@/components/ui/toaster";
import { PaymentMethodsList } from "@/components/payment-methods-list";
import { cn, formatDate } from "@/lib/utils";
import {
  PAYMENT_METHODS,
  type Balance,
  type SettlementTransfer,
} from "@/lib/types";

interface SettlementRecord {
  id: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
  settledAt: string;
}

const transferKey = (t: SettlementTransfer) => `${t.from}-${t.to}-${t.amount}`;

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

/** iOS-style grouped-list label that sits above a card. */
function SectionLabel({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="mb-2 px-1 text-sm font-semibold text-muted-foreground"
    >
      {children}
    </h2>
  );
}

/** Payer → payee, as two overlapping avatars joined by an arrow. */
function AvatarPair({ t }: { t: SettlementTransfer }) {
  return (
    <div className="flex flex-shrink-0 items-center" aria-hidden>
      <MemberAvatar
        id={t.from}
        name={t.fromName}
        className="h-11 w-11 ring-2 ring-card"
      />
      <span className="z-10 -mx-1.5 flex h-7 w-7 items-center justify-center rounded-full border bg-card text-muted-foreground">
        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <MemberAvatar
        id={t.to}
        name={t.toName}
        className="h-11 w-11 ring-2 ring-card"
      />
    </div>
  );
}

function TransferCard({
  t,
  currentUserId,
  settling,
  onMarkPaid,
  onRemind,
  children,
}: {
  t: SettlementTransfer;
  currentUserId: string | null | undefined;
  settling: boolean;
  onMarkPaid: () => void;
  onRemind: () => void;
  /** Ways to pay the payee, when you're the one paying. */
  children?: React.ReactNode;
}) {
  const money = useMoney();
  const youPay = t.from === currentUserId;
  const owedToYou = t.to === currentUserId;
  const mine = youPay || owedToYou;
  const fromLabel = youPay ? "You" : t.fromName;
  const toLabel = owedToYou ? "you" : t.toName;

  return (
    <Card
      className={cn(
        "p-4",
        mine && "border-primary/40 shadow-md shadow-primary/5",
      )}
    >
      {/* The sentence sits beside the avatars when it fits there on one
          line, and otherwise drops under them at full width instead of
          being squeezed into a narrow column. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <AvatarPair t={t} />
        <p className="min-w-0 flex-auto text-balance text-base leading-snug">
          <span className="font-semibold">{fromLabel}</span>{" "}
          {youPay ? "pay" : "pays"}{" "}
          <span className="font-semibold">{toLabel}</span>
        </p>
      </div>

      <p
        className={cn(
          "mt-3 font-bold tabular-nums tracking-tight",
          mine ? "text-4xl" : "text-3xl",
          youPay && "text-negative",
          owedToYou && "text-positive",
        )}
      >
        {money(t.amount)}
      </p>

      {children}

      {/* Side by side when both fit, stacked full-width on phones instead of
          squeezing the labels. */}
      <div className="mt-4 flex flex-wrap gap-2 [&>*]:min-w-[10rem] [&>*]:flex-1">
        <Button
          variant={mine ? "default" : "outline"}
          onClick={onMarkPaid}
          disabled={settling}
        >
          {settling ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Check aria-hidden />
          )}
          Mark as paid
        </Button>
        {owedToYou && (
          <Button variant="outline" onClick={onRemind}>
            <Bell aria-hidden />
            Remind {firstName(t.fromName)}
          </Button>
        )}
      </div>
    </Card>
  );
}

function TransferSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>
        <Skeleton className="h-5 flex-1" />
      </div>
      <Skeleton className="mt-4 h-9 w-36" />
      <Skeleton className="mt-4 h-12 w-full rounded-xl" />
    </Card>
  );
}

function LoadingState() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Loading payments…</span>
      <div className="space-y-3" aria-hidden>
        <Skeleton className="ml-1 h-4 w-28" />
        <TransferSkeleton />
        <TransferSkeleton />
      </div>
    </div>
  );
}

/** Nobody owes anybody — worth a little celebration. */
function SettledState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="relative flex flex-col items-center overflow-hidden px-6 py-10 text-center">
      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <PartyPopper className="h-7 w-7" aria-hidden />
        {/* A few confetti flecks around the tile. */}
        <span
          aria-hidden
          className="absolute -left-5 -top-2 h-2 w-2 rotate-12 rounded-sm bg-primary/70"
        />
        <span
          aria-hidden
          className="absolute -right-6 top-1 h-2.5 w-1.5 -rotate-12 rounded-sm bg-positive/80"
        />
        <span
          aria-hidden
          className="absolute -left-7 bottom-1 h-1.5 w-2.5 rotate-45 rounded-sm bg-negative/70"
        />
        <span
          aria-hidden
          className="absolute -right-4 -bottom-3 h-2 w-2 rounded-full bg-primary/40"
        />
        <span
          aria-hidden
          className="absolute -top-5 right-2 h-1.5 w-1.5 rounded-full bg-positive/60"
        />
      </span>
      <h2 className="mt-5 text-lg font-semibold">Everyone&apos;s settled up</h2>
      <p className="mt-1 max-w-xs text-balance text-sm text-muted-foreground">
        No payments needed right now. Nice work, everyone.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        className="mt-5 px-6"
      >
        <Plus aria-hidden />
        Add expense
      </Button>
    </Card>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card
      role="alert"
      className="flex flex-col items-center px-6 py-8 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-negative-soft text-negative">
        <AlertCircle className="h-7 w-7" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold">
        Couldn&apos;t load payments
      </h2>
      <p className="mt-1 max-w-xs text-balance text-sm text-muted-foreground">
        Check your connection and try again.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onRetry}
        className="mt-5 px-6"
      >
        Try again
      </Button>
    </Card>
  );
}

export default function SettlePage() {
  const { version, mutate, currentUserId, isAdmin, members } = useAppData();
  const money = useMoney();
  const addExpense = useAddExpense();
  const { toast } = useToast();
  const { data, loading, error, refetch } = useFetch<{
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
  const mine = transfers.filter(
    (t) => t.from === currentUserId || t.to === currentUserId,
  );
  const others = transfers.filter(
    (t) => t.from !== currentUserId && t.to !== currentUserId,
  );
  const settlements = history.data?.settlements ?? [];

  async function markAllPaid() {
    if (
      !window.confirm(
        "Record every outstanding payment as settled? This clears all balances.",
      )
    ) {
      return;
    }
    setSettlingAll(true);
    try {
      const res = await fetch("/api/settle/all", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: body.error || "Could not settle everyone",
          variant: "error",
        });
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
      `Hey ${t.fromName}, friendly reminder you owe me ${money(t.amount)} on BillSpilt.` +
      (ways ? ` You can pay me with ${ways}.` : "");

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "BillSpilt reminder", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast({
        title: "Reminder copied",
        description: "Paste it to send.",
        variant: "success",
      });
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
    const key = transferKey(t);
    setSettling(key);
    try {
      const res = await fetch("/api/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: t.from, to: t.to, amount: t.amount }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast({
          title: body.error || "Could not record payment",
          variant: "error",
        });
        return;
      }
      toast({ title: "Settled up!", variant: "success" });
      mutate();
      await Promise.all([refetch(), refetchHistory()]);
    } finally {
      setSettling(null);
    }
  }

  function renderTransfer(t: SettlementTransfer) {
    const key = transferKey(t);
    // When you're the payer, show the payee's ways to pay.
    const payee = members.find((m) => m.id === t.to);
    const showPay =
      t.from === currentUserId && (payee?.paymentMethods?.length ?? 0) > 0;
    const payerName = members.find((m) => m.id === t.from)?.name;
    return (
      <li key={key}>
        <TransferCard
          t={t}
          currentUserId={currentUserId}
          settling={settling === key}
          onMarkPaid={() => markPaid(t)}
          onRemind={() => shareReminder(t)}
        >
          {showPay && (
            <div className="mt-4 border-t pt-3">
              <p className="text-sm font-semibold text-muted-foreground">
                Pay {firstName(t.toName)} with
              </p>
              <PaymentMethodsList
                methods={payee!.paymentMethods}
                linkContext={{
                  amount: t.amount,
                  note: payerName
                    ? `BillSpilt — from ${payerName}`
                    : "BillSpilt",
                }}
              />
            </div>
          )}
        </TransferCard>
      </li>
    );
  }

  let plan: React.ReactNode;
  if (loading && !data) {
    plan = <LoadingState />;
  } else if (error && !data) {
    plan = <ErrorState onRetry={() => void refetch()} />;
  } else if (transfers.length === 0) {
    plan = <SettledState onAdd={addExpense} />;
  } else {
    plan = (
      <>
        <div>
          <div className="space-y-6">
            {mine.length > 0 ? (
              <section aria-labelledby="settle-yours">
                <SectionLabel id="settle-yours">Your payments</SectionLabel>
                <ul className="space-y-3">{mine.map(renderTransfer)}</ul>
              </section>
            ) : (
              <Card className="flex items-center gap-3 p-4">
                <span className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-positive-soft text-positive min-[360px]:flex">
                  <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-semibold">
                    You&apos;re all square
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The payments below are between your roommates.
                  </p>
                </div>
              </Card>
            )}

            {others.length > 0 && (
              <section aria-labelledby="settle-others">
                <SectionLabel id="settle-others">
                  Between roommates
                </SectionLabel>
                <ul className="space-y-3">{others.map(renderTransfer)}</ul>
              </section>
            )}
          </div>
          <p className="mt-3 px-1 text-balance text-sm text-muted-foreground">
            Paid in cash or another way? Mark it as paid here too.
          </p>
        </div>

        {isAdmin && (
          <section aria-labelledby="settle-admin">
            <SectionLabel id="settle-admin">Admin</SectionLabel>
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <span className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary min-[360px]:flex">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-semibold">Settle everyone up</p>
                  <p className="text-sm text-muted-foreground">
                    Record all {transfers.length} payment
                    {transfers.length === 1 ? "" : "s"} at once and clear every
                    balance.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={markAllPaid}
                disabled={settlingAll}
              >
                {settlingAll ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <CheckCheck aria-hidden />
                )}
                Mark all paid
              </Button>
            </Card>
          </section>
        )}
      </>
    );
  }

  return (
    <div className="duration-500 animate-in fade-in slide-in-from-bottom-3">
      <PageHeader
        title="Settle up"
        subtitle={
          <span className="block text-balance">
            The fewest payments to clear all debts.
          </span>
        }
      />

      <div className="space-y-6">
        {plan}

        {settlements.length > 0 && (
          <section aria-labelledby="settle-history">
            <SectionLabel id="settle-history">History</SectionLabel>
            <Card>
              <ul className="divide-y">
                {settlements.map((s) => {
                  const fromYou = s.from === currentUserId;
                  const toYou = s.to === currentUserId;
                  return (
                    <li
                      key={s.id}
                      className="flex min-h-14 items-center gap-3 py-3 pl-4 pr-2"
                    >
                      <MemberAvatar
                        id={s.from}
                        name={s.fromName}
                        className="hidden h-10 w-10 flex-shrink-0 min-[360px]:flex"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-3 text-base font-medium leading-snug">
                          {fromYou ? "You" : s.fromName} paid{" "}
                          {toYou ? "you" : s.toName}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          <span
                            className={cn(
                              "font-semibold tabular-nums",
                              fromYou
                                ? "text-negative"
                                : toYou
                                  ? "text-positive"
                                  : "text-foreground",
                            )}
                          >
                            {money(s.amount)}
                          </span>
                          {" · "}
                          {formatDate(s.settledAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => undoSettlement(s.id)}
                        disabled={undoing === s.id}
                        aria-label={`Undo settlement: ${fromYou ? "you" : s.fromName} paid ${toYou ? "you" : s.toName} ${money(s.amount)}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {undoing === s.id ? (
                          <Loader2 className="animate-spin" aria-hidden />
                        ) : (
                          <Undo2 aria-hidden />
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
