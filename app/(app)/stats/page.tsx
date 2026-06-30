"use client";

import * as React from "react";
import { Plus, Repeat, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { RecurringForm } from "@/components/recurring-form";
import { MemberAvatar } from "@/components/member-avatar";
import { useAppData, useMoney } from "@/components/app-data";
import { useFetch } from "@/lib/use-fetch";
import { useToast } from "@/components/ui/toaster";
import { CATEGORIES, type Expense, type RecurringBill } from "@/lib/types";
import { colorForId } from "@/lib/utils";

export default function StatsPage() {
  const { version, mutate } = useAppData();
  const money = useMoney();
  const { toast } = useToast();
  const expensesQ = useFetch<{ expenses: Expense[] }>("/api/expenses");
  const recurringQ = useFetch<{ bills: RecurringBill[] }>("/api/recurring");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const { refetch: refetchExpenses } = expensesQ;
  const { refetch: refetchRecurring } = recurringQ;
  React.useEffect(() => {
    void refetchExpenses();
    void refetchRecurring();
  }, [version, refetchExpenses, refetchRecurring]);

  const expenses = React.useMemo(
    () => expensesQ.data?.expenses ?? [],
    [expensesQ.data],
  );
  const bills = recurringQ.data?.bills ?? [];

  const { total, byCategory, byPayer } = React.useMemo(() => {
    let total = 0;
    const byCategory: Record<string, number> = {};
    const byPayer = new Map<string, { name: string; amount: number }>();
    for (const e of expenses) {
      total += e.amount;
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
      const prev = byPayer.get(e.paidBy);
      byPayer.set(e.paidBy, {
        name: e.paidByName,
        amount: (prev?.amount ?? 0) + e.amount,
      });
    }
    return { total, byCategory, byPayer };
  }, [expenses]);

  const breakdown = CATEGORIES.map((c) => ({
    ...c,
    amount: byCategory[c.value] ?? 0,
  }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const payers = Array.from(byPayer.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.amount - a.amount);

  async function deleteBill(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/recurring?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast({ title: "Could not delete bill", variant: "error" });
        return;
      }
      toast({ title: "Recurring bill removed", variant: "success" });
      await recurringQ.refetch();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-5 duration-500 animate-in fade-in slide-in-from-bottom-3">
      <h1 className="text-lg font-bold">Stats</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total spent</p>
            {expensesQ.loading && !expensesQ.data ? (
              <Skeleton className="mt-1 h-8 w-24" />
            ) : (
              <p className="mt-1 text-2xl font-bold">{money(total)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Expenses logged</p>
            <p className="mt-1 text-2xl font-bold">{expenses.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By category</CardTitle>
        </CardHeader>
        <CardContent>
          {breakdown.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No spending to chart yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {breakdown.map((c) => {
                const pct = total > 0 ? (c.amount / total) * 100 : 0;
                return (
                  <li key={c.value}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>
                        {c.emoji} {c.label}
                      </span>
                      <span className="font-medium">
                        {money(c.amount)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: colorForId(c.value),
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {payers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Who paid</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {payers.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <MemberAvatar id={p.id} name={p.name} className="h-8 w-8" />
                  <span className="flex-1 truncate text-sm">{p.name}</span>
                  <span className="text-sm font-medium">
                    {money(p.amount)}
                  </span>
                  <span className="w-12 text-right text-xs text-muted-foreground">
                    {total > 0 ? Math.round((p.amount / total) * 100) : 0}%
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Repeat className="h-4 w-4 text-primary" />
            Recurring bills
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setSheetOpen(true)}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Add rent, internet, or subscriptions to auto-log them.
            </p>
          ) : (
            <ul className="divide-y">
              {bills.map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{b.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {money(b.amount)} · paid by {b.paidByName} · next{" "}
                      {b.nextRun}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {b.frequency}
                  </Badge>
                  <button
                    onClick={() => deleteBill(b.id)}
                    disabled={deleting === b.id}
                    aria-label="Delete recurring bill"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive"
                  >
                    {deleting === b.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
          <SheetHeader className="mb-4">
            <SheetTitle>New recurring bill</SheetTitle>
            <SheetDescription>
              Auto-logged on schedule by a daily job.
            </SheetDescription>
          </SheetHeader>
          <RecurringForm
            onDone={() => {
              setSheetOpen(false);
              mutate();
              void recurringQ.refetch();
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
