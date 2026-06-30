"use client";

import * as React from "react";
import { Receipt, ArrowDownToLine, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ExpenseItem } from "@/components/expense-item";
import { ExpenseDetailSheet } from "@/components/expense-detail-sheet";
import { ExpenseForm } from "@/components/expense-form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useAppData } from "@/components/app-data";
import { useFetch } from "@/lib/use-fetch";
import { useToast } from "@/components/ui/toaster";
import { formatDate, cn } from "@/lib/utils";
import { CATEGORIES, type Expense, type ExpenseCategory } from "@/lib/types";

export default function ExpensesPage() {
  const { currentUserId, version, mutate } = useAppData();
  const { toast } = useToast();
  const { data, loading, refetch } = useFetch<{ expenses: Expense[] }>(
    "/api/expenses",
  );
  const [selected, setSelected] = React.useState<Expense | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Expense | null>(null);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<ExpenseCategory | "all">("all");

  function openDetail(expense: Expense) {
    setSelected(expense);
    setDetailOpen(true);
  }

  function startEdit(expense: Expense) {
    setDetailOpen(false);
    setEditing(expense);
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

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (q && !e.description.toLowerCase().includes(q) && !e.paidByName.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [expenses, query, category]);

  const filtering = query.trim() !== "" || category !== "all";

  // Group by day for readable history.
  const groups = React.useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of filtered) {
      const key = e.createdAt.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // Categories that actually appear, for the filter chips.
  const usedCategories = React.useMemo(() => {
    const present = new Set(expenses.map((e) => e.category));
    return CATEGORIES.filter((c) => present.has(c.value));
  }, [expenses]);

  return (
    <div className="space-y-4 duration-500 animate-in fade-in slide-in-from-bottom-3">
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

      {/* Search + category filters (shown once there are expenses) */}
      {expenses.length > 0 && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search description or who paid"
              className="pl-9 pr-9"
              inputMode="search"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
          {usedCategories.length > 0 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              <FilterChip
                active={category === "all"}
                onClick={() => setCategory("all")}
                label="All"
              />
              {usedCategories.map((c) => (
                <FilterChip
                  key={c.value}
                  active={category === c.value}
                  onClick={() => setCategory(c.value)}
                  label={`${c.emoji} ${c.label}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Search className="mb-2 h-6 w-6 text-muted-foreground" />
            <p className="font-medium">No matching expenses</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
              className="mt-1 text-sm font-medium text-primary"
            >
              Clear filters
            </button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {filtering
              ? `${filtered.length} of ${expenses.length} expenses`
              : "Swipe a row left to delete it."}
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
        onEdit={startEdit}
      />

      <Sheet
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
          <SheetHeader className="mb-4">
            <SheetTitle>Edit expense</SheetTitle>
            <SheetDescription>Update the details or how it&apos;s split.</SheetDescription>
          </SheetHeader>
          {editing && (
            <ExpenseForm
              expense={editing}
              onDone={() => {
                setEditing(null);
                void refetch();
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 flex-shrink-0 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}
