"use client";

import { ArrowUpRight, ArrowDownRight, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MemberAvatar } from "@/components/member-avatar";
import { useMoney } from "@/components/app-data";
import { cn } from "@/lib/utils";
import type { Balance } from "@/lib/types";

/** Big hero showing the current user's overall position. */
export function NetSummary({ net }: { net: number }) {
  const money = useMoney();
  const owed = net > 0.005;
  const owes = net < -0.005;
  return (
    <Card
      className={cn(
        "overflow-hidden border-0 text-white shadow-md",
        owed && "bg-gradient-to-br from-emerald-500 to-green-600",
        owes && "bg-gradient-to-br from-rose-500 to-red-600",
        !owed && !owes && "bg-gradient-to-br from-slate-600 to-slate-700",
      )}
    >
      <CardContent className="p-5">
        <p className="text-sm/none opacity-90">
          {owed ? "You are owed" : owes ? "You owe" : "You're all settled"}
        </p>
        <p className="mt-2 text-4xl font-extrabold tracking-tight">
          {money(Math.abs(net))}
        </p>
        <p className="mt-1 text-sm opacity-90">
          {owed
            ? "Your roommates owe you overall."
            : owes
              ? "Time to settle up."
              : "No outstanding balances. Nice!"}
        </p>
      </CardContent>
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
    <li className="flex items-center gap-3 py-3">
      <MemberAvatar id={balance.userId} name={balance.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {balance.name}
          {isCurrentUser && (
            <span className="ml-1 text-xs text-muted-foreground">(you)</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {owed ? "gets back" : owes ? "owes" : "settled up"}
        </p>
      </div>
      <div
        className={cn(
          "flex items-center gap-1 font-semibold",
          owed && "text-emerald-600",
          owes && "text-rose-600",
          !owed && !owes && "text-muted-foreground",
        )}
      >
        {owed && <ArrowUpRight className="h-4 w-4" />}
        {owes && <ArrowDownRight className="h-4 w-4" />}
        {!owed && !owes && <Check className="h-4 w-4" />}
        {net === 0 ? "—" : money(Math.abs(net))}
      </div>
    </li>
  );
}
