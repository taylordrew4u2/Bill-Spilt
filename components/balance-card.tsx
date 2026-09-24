"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Check, Plus, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberAvatar } from "@/components/member-avatar";
import { useAddExpense } from "@/components/add-expense-sheet";
import { useMoney } from "@/components/app-data";
import { cn } from "@/lib/utils";
import type { Balance } from "@/lib/types";

/** Step the hero figure down for long amounts (big balances, wordy currency
 *  symbols) so it never runs past the card on a 320px phone. */
function heroSize(text: string) {
  if (text.length <= 9) return "text-5xl";
  if (text.length <= 12) return "text-4xl";
  return "text-3xl";
}

/** Big hero showing the current user's overall position, with the next thing
 *  to do right under it. */
export function NetSummary({ net }: { net: number }) {
  const money = useMoney();
  const addExpense = useAddExpense();
  const owed = net > 0.005;
  const owes = net < -0.005;
  const amount = money(Math.abs(net));
  const Icon = owed ? ArrowDownLeft : owes ? ArrowUpRight : Check;

  return (
    <Card
      className={cn(
        "p-4 sm:p-5",
        owed && "border-positive/20 bg-positive-soft",
        owes && "border-negative/20 bg-negative-soft",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
            owed && "bg-positive/15 text-positive",
            owes && "bg-negative/15 text-negative",
            !owed && !owes && "bg-muted text-muted-foreground",
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={2.4} />
        </span>
        <p className="text-base font-semibold">
          {owed ? "You're owed" : owes ? "You owe" : "You're all square"}
        </p>
      </div>

      <p
        className={cn(
          "mt-3 font-bold tabular-nums tracking-tight",
          heroSize(amount),
          owed && "text-positive",
          owes && "text-negative",
        )}
      >
        {amount}
      </p>
      <p className="mt-1 text-balance text-sm text-muted-foreground">
        {owed || owes
          ? "In total, across all your roommates."
          : "You don't owe anyone, and no one owes you."}
      </p>

      {/* Side by side when they fit, stacked full-width on the narrowest
          phones instead of squeezing the labels. */}
      <div className="mt-5 flex flex-wrap gap-2 [&>*]:flex-1">
        {(owed || owes) && (
          <Button asChild size="sm">
            <Link href="/settle">
              <Scale aria-hidden />
              Settle up
            </Link>
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant={owed || owes ? "outline" : "default"}
          onClick={addExpense}
        >
          <Plus aria-hidden />
          Add expense
        </Button>
      </div>
    </Card>
  );
}

/** Placeholder shaped like <NetSummary /> while balances load. */
export function NetSummarySkeleton() {
  return (
    <Card className="p-4 sm:p-5" aria-hidden>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-5 w-28" />
      </div>
      <Skeleton className="mt-4 h-11 w-48 rounded-lg" />
      <Skeleton className="mt-3 h-4 w-56 max-w-full" />
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 flex-1 rounded-xl" />
      </div>
    </Card>
  );
}

/** Per-member net balance row. */
export function BalanceRow({
  balance,
  isCurrentUser,
}: {
  balance: Balance;
  isCurrentUser: boolean;
}) {
  const money = useMoney();
  const { net } = balance;
  const owed = net > 0.005;
  const owes = net < -0.005;
  return (
    <li className="flex min-h-14 items-center gap-3 px-4 py-3">
      <MemberAvatar
        id={balance.userId}
        name={balance.name}
        className="h-10 w-10"
      />
      {/* The name keeps at least ~7rem; when the amount doesn't fit beside it
          (narrow phone, large text setting, big balance) the amount drops to
          its own line instead of cutting the name down to a few letters. */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
        <div className="min-w-0 grow basis-28">
          <p className="line-clamp-2 break-words text-base font-medium leading-snug">
            {balance.name}
            {isCurrentUser && (
              <span className="font-normal text-muted-foreground"> (you)</span>
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {owed ? "Gets back" : owes ? "Owes" : "Settled up"}
          </p>
        </div>
        <p
          className={cn(
            "whitespace-nowrap text-base font-semibold tabular-nums",
            owed && "text-positive",
            owes && "text-negative",
            !owed && !owes && "text-muted-foreground",
          )}
        >
          {net === 0 ? "—" : money(Math.abs(net))}
        </p>
      </div>
    </li>
  );
}

/** Placeholder shaped like a <BalanceRow />. */
export function BalanceRowSkeleton() {
  return (
    <li className="flex min-h-14 items-center gap-3 px-4 py-3" aria-hidden>
      <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-32 max-w-full" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      <Skeleton className="h-5 w-20 flex-shrink-0" />
    </li>
  );
}
