"use client";

import * as React from "react";
import {
  Receipt,
  Download,
  Search,
  SearchX,
  X,
  Plus,
  RotateCw,
  CloudOff,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ExpenseItem } from "@/components/expense-item";
import { ExpenseDetailSheet } from "@/components/expense-detail-sheet";
import { ExpenseForm } from "@/components/expense-form";
import { useAddExpense } from "@/components/add-expense-sheet";
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
import { cn } from "@/lib/utils";
import { CATEGORIES, type Expense, type ExpenseCategory } from "@/lib/types";

/** Local calendar day (YYYY-MM-DD), so an evening expense is grouped under the
 *  day it happened for you rather than the UTC date. */
function dayKey(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** "Today", "Yesterday", else "Mon, Sep 22" (with the year when it isn't this year). */
function dayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysAgo = Math.round((today.getTime() - date.getTime()) / 86_400_000);
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: y === today.getFullYear() ? undefined : "numeric",
  }).format(date);
}

export default function ExpensesPage() {
  const { currentUserId, version, mutate } = useAppData();
  const { toast } = useToast();
  const addExpense = useAddExpense();
  const { data, loading, error, refetch } = useFetch<{ expenses: Expense[] }>(
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

  function deleteFromDetail(id: string) {
    setDetailOpen(false);
    void handleDelete(id);
  }

  function clearFilters() {
    setQuery("");
    setCategory("all");
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
      const key = dayKey(e.createdAt);
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

  const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label;

  return (
    <div className="duration-500 animate-in fade-in slide-in-from-bottom-3">
      <PageHeader
        title="Expenses"
        subtitle={
          expenses.length > 0
            ? `${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"}`
            : undefined
        }
        action={
          <Button asChild variant="outline" size="sm">
            <a href="/api/export" title="Download every expense as a CSV file">
              <Download aria-hidden />
              Export
              <span className="sr-only"> as CSV</span>
            </a>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Search + category filters (shown once there are expenses) */}
        {expenses.length > 0 && (
          <div className="space-y-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search expenses or payers"
                aria-label="Search expenses"
                className={cn("pl-12", query ? "pr-12" : "pr-4")}
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              )}
            </div>
            {usedCategories.length > 0 && (
              <div
                role="group"
                aria-label="Filter by category"
                className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
              >
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
                    label={c.label}
                    icon={c.icon}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {loading && !data ? (
          <ListSkeleton />
        ) : error && !data ? (
          <EmptyState
            icon={CloudOff}
            title="Couldn't load expenses"
            body="Check your connection and try again."
          >
            <Button variant="outline" onClick={() => void refetch()}>
              <RotateCw aria-hidden />
              Try again
            </Button>
          </EmptyState>
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            body="Log a shared cost and BillSpilt works out who owes what."
          >
            <Button onClick={addExpense}>
              <Plus aria-hidden />
              Add expense
            </Button>
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No matching expenses"
            body={
              query.trim()
                ? `Nothing${categoryLabel ? ` in ${categoryLabel}` : ""} matches “${query.trim()}”.`
                : `No ${categoryLabel ?? ""} expenses yet.`
            }
          >
            <div className="flex w-full max-w-xs flex-col gap-2">
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
              <Button variant="ghost" className="text-primary" onClick={addExpense}>
                <Plus aria-hidden />
                Add expense
              </Button>
            </div>
          </EmptyState>
        ) : (
          <>
            {filtering && (
              <div className="-my-2 flex items-center justify-between gap-3">
                <p className="px-1 text-sm text-muted-foreground" aria-live="polite">
                  {filtered.length} of {expenses.length} expenses
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-mr-2 text-primary"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              </div>
            )}
            {groups.map(([day, items]) => (
              <section key={day} aria-label={dayLabel(day)}>
                <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
                  {dayLabel(day)}
                </h2>
                <Card className="divide-y overflow-hidden">
                  {items.map((e) => (
                    <ExpenseItem
                      key={e.id}
                      expense={e}
                      currentUserId={currentUserId}
                      onDelete={handleDelete}
                      onOpen={openDetail}
                    />
                  ))}
                </Card>
              </section>
            ))}
            <p className="px-4 text-center text-sm text-muted-foreground">
              Tap an expense for details. Swipe one left to delete it.
            </p>
          </>
        )}
      </div>

      <ExpenseDetailSheet
        expense={selected}
        currentUserId={currentUserId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={startEdit}
        onDelete={deleteFromDetail}
      />

      <Sheet
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
          <SheetHeader className="mb-5">
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
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-11 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors active:scale-[0.97]",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card text-foreground hover:bg-accent",
      )}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden />}
      {label}
    </button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <p className="mt-4 text-lg font-semibold">{title}</p>
      <p className="mt-1 line-clamp-2 max-w-xs text-sm text-muted-foreground">{body}</p>
      {children && <div className="mt-5 flex w-full justify-center">{children}</div>}
    </Card>
  );
}

/** Placeholder shaped like the grouped list: a day label over a card of rows. */
function ListSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading expenses">
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="flex gap-2 overflow-hidden">
          {[56, 104, 72, 88].map((w) => (
            <Skeleton key={w} className="h-11 flex-shrink-0 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-3 ml-1 h-4 w-20" />
        <Card className="divide-y overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex min-h-[4.5rem] items-center gap-3 px-4 py-3">
              <Skeleton className="h-10 w-10 flex-shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3.5 w-2/5" />
              </div>
              <Skeleton className="h-4 w-14 flex-shrink-0" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
