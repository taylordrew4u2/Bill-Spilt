"use client";

import * as React from "react";
import { Receipt, ArrowDownToLine } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpenseItem } from "@/components/expense-item";
import { ExpenseDetailSheet } from "@/components/expense-detail-sheet";
import { useAppData } from "@/components/app-data";
import { useFetch } from "@/lib/use-fetch";
import { useToast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/utils";
import type { Expense } from "@/lib/types";

export default function ExpensesPage() {
  const { currentUserId, version, mutate } = useAppData();
  const { toast } = useToast();
  const { data, loading, refetch } = useFetch<{ expenses: Expense[] }>(
    "/api/expenses",
  );
  const [selected, setSelected] = React.useState<Expense | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  function openDetail(expense: Expense) {
    setSelected(expense);
    setDetailOpen(true);
  }

  React.useEffect(() => {
    void refetch();
  }, [version, refetch]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast({ title: "Could not delete expense", variant: "error" });
      void refetch();
      return;
    }
    toast({ title: "Expense deleted", variant: "success" });
    mutate();
    void refetch();
  }

  const expenses = React.useMemo(() => data?.expenses ?? [], [data]);

  // Group by day for readable history.
  const groups = React.useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of expenses) {
      const key = e.createdAt.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [expenses]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Expenses</h1>
        <a
          href="/api/export"
          className="flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-medium active:scale-95"
        >
          <ArrowDownToLine className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      {loading && !data ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Receipt className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">No expenses yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the + button to log your first shared cost.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Swipe a row left to delete it.
          </p>
          {groups.map(([day, items]) => (
            <div key={day}>
              <p className="mb-1 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {formatDate(day)}
              </p>
              <Card>
                <CardContent className="divide-y px-4 py-0">
                  {items.map((e) => (
                    <ExpenseItem
                      key={e.id}
                      expense={e}
                      currentUserId={currentUserId}
                      onDelete={handleDelete}
                      onOpen={openDetail}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </>
      )}

      <ExpenseDetailSheet
        expense={selected}
        currentUserId={currentUserId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
