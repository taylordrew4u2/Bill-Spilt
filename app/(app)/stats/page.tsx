"use client";

import * as React from "react";
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  Package,
  PieChart,
  Plus,
  Repeat,
  RotateCw,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { PageHeader } from "@/components/page-header";
import { RecurringForm } from "@/components/recurring-form";
import { PendingBillsCard, formatDueDate } from "@/components/pending-bills-card";
import { MemberAvatar } from "@/components/member-avatar";
import { useAddExpense } from "@/components/add-expense-sheet";
import { useAppData, useMoney } from "@/components/app-data";
import { useFetch } from "@/lib/use-fetch";
import { useToast } from "@/components/ui/toaster";
import {
  CATEGORIES,
  type Expense,
  type PendingRecurringCharge,
  type RecurringBill,
} from "@/lib/types";

const FREQUENCY_LABEL: Record<RecurringBill["frequency"], string> = {
  weekly: "Weekly",
  monthly: "Monthly",
};

const SPLIT_LABEL: Record<RecurringBill["splitType"], string> = {
  equal: "Equally",
  percent: "By percent",
  exact: "Exact amounts",
};

/** "12%", or "<1%" for a sliver that would otherwise round to nothing. */
function percentLabel(part: number, total: number): string {
  if (total <= 0) return "0%";
  const pct = (part / total) * 100;
  if (pct > 0 && pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function categoryOf(value: string) {
  return CATEGORIES.find((c) => c.value === value);
}

/** iOS-style grouped-list label that sits above a card. */
function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
      {children}
    </h2>
  );
}

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="h-5 w-5" aria-hidden />
    </span>
  );
}

/** A leading icon or avatar that gives way on a narrow screen, where the
 *  row's text needs the width more than a picture of what it already says. */
function Leading({ children }: { children: React.ReactNode }) {
  return <span className="hidden flex-shrink-0 min-[360px]:block">{children}</span>;
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 px-4 py-3">
      <dt className="text-base text-muted-foreground">{label}</dt>
      <dd className="whitespace-nowrap text-base font-semibold tabular-nums">{children}</dd>
    </div>
  );
}

/**
 * One line of a horizontal bar chart: the label and amount on one line (the
 * amount drops under a label too long to share it), a thick bar below with
 * its share of the total beside it. Every value is printed, so the bar only
 * has to show proportion at a glance.
 */
function BarRow({
  leading,
  label,
  amount,
  part,
  total,
}: {
  leading: React.ReactNode;
  label: React.ReactNode;
  amount: string;
  part: number;
  total: number;
}) {
  const pct = total > 0 ? (part / total) * 100 : 0;
  return (
    <li className="flex min-h-14 items-center gap-3 px-4 py-3">
      <Leading>{leading}</Leading>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="line-clamp-2 min-w-0 break-words text-base font-medium leading-snug">
            {label}
          </span>
          <span className="whitespace-nowrap text-base font-semibold leading-snug tabular-nums">
            {amount}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div aria-hidden className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              // A floor so the smallest slice still shows up as a sliver.
              style={{ width: `${pct > 0 ? Math.max(pct, 2) : 0}%` }}
            />
          </div>
          <span className="w-11 flex-shrink-0 text-right text-sm tabular-nums text-muted-foreground">
            {percentLabel(part, total)}
            <span className="sr-only"> of all spending</span>
          </span>
        </div>
      </div>
    </li>
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
    <Card className="flex flex-col items-center px-6 py-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <p className="mt-4 text-lg font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-balance text-sm text-muted-foreground">{body}</p>
      {children && <div className="mt-5 flex w-full justify-center">{children}</div>}
    </Card>
  );
}

function ErrorState({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <Card role="alert" className="flex flex-col items-center px-6 py-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-negative-soft text-negative">
        <AlertCircle className="h-7 w-7" aria-hidden />
      </span>
      <p className="mt-4 text-lg font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-balance text-sm text-muted-foreground">
        Check your connection and try again.
      </p>
      <Button type="button" variant="outline" onClick={onRetry} className="mt-5 px-6">
        <RotateCw aria-hidden />
        Try again
      </Button>
    </Card>
  );
}

/** Placeholder shaped like the tiles and the category chart. */
function SpendingSkeleton() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Loading stats…</span>
      <Card aria-hidden>
        <div className="p-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-3 h-9 w-40" />
        </div>
        <div className="divide-y border-t">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex justify-between gap-3 px-4 py-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </Card>
      <div aria-hidden>
        <Skeleton className="mb-3 ml-1 h-4 w-40" />
        <Card>
          <ul className="divide-y">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="hidden h-10 w-10 flex-shrink-0 rounded-xl min-[360px]:block" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function RecurringSkeleton() {
  return (
    <Card role="status">
      <span className="sr-only">Loading recurring bills…</span>
      <ul className="divide-y" aria-hidden>
        {[0, 1].map((i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="hidden h-10 w-10 flex-shrink-0 rounded-xl min-[360px]:block" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-16" />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function RecurringRow({
  bill,
  onOpen,
}: {
  bill: RecurringBill;
  onOpen: (bill: RecurringBill) => void;
}) {
  const money = useMoney();
  const variable = bill.amountType === "variable";
  const Icon = categoryOf(bill.category)?.icon ?? Package;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(bill)}
        className="flex min-h-14 w-full items-center gap-3 py-3 pl-4 pr-3 text-left transition-colors [@media(hover:hover)]:hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:bg-accent"
      >
        <Leading>
          <IconTile icon={Icon} />
        </Leading>
        <span className="min-w-0 flex-1">
          {/* The name keeps the full width; the amount shares its line when
              both fit and drops under it when they don't. */}
          <span className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="line-clamp-2 min-w-0 break-words text-base font-medium leading-snug">
              {bill.description}
            </span>
            {variable && bill.amount <= 0 ? (
              <span className="whitespace-nowrap text-base font-medium leading-snug text-muted-foreground">
                Varies
              </span>
            ) : (
              <span className="whitespace-nowrap text-base font-semibold leading-snug tabular-nums">
                {variable && (
                  <>
                    <span aria-hidden>~</span>
                    <span className="sr-only">about </span>
                  </>
                )}
                {money(bill.amount)}
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {FREQUENCY_LABEL[bill.frequency]} ·{" "}
            <span className="whitespace-nowrap">due {formatDueDate(bill.nextRun)}</span>
          </span>
        </span>
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </li>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3">
      <dt className="flex-shrink-0 text-base text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center justify-end gap-2 text-right text-base font-medium">
        {children}
      </dd>
    </div>
  );
}

/** Everything about one recurring bill, and the place to delete it. */
function RecurringBillSheet({
  bill,
  open,
  onOpenChange,
  deleting,
  onDelete,
}: {
  bill: RecurringBill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleting: boolean;
  onDelete: (id: string) => void;
}) {
  const money = useMoney();
  const { currentUserId } = useAppData();
  if (!bill) return null;

  const variable = bill.amountType === "variable";
  const cat = categoryOf(bill.category);
  const CatIcon = cat?.icon ?? Package;
  const per = bill.frequency === "weekly" ? "week" : "month";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
        <SheetHeader className="mb-5">
          <SheetTitle className="line-clamp-2">{bill.description}</SheetTitle>
          <SheetDescription>
            {variable
              ? `We ask for the amount each ${per} when it's due.`
              : `Logged for you automatically every ${per}.`}
          </SheetDescription>
        </SheetHeader>

        <div className="rounded-2xl bg-muted/60 px-4 py-5 text-center">
          {variable ? (
            <>
              <p className="text-3xl font-bold tracking-tight">Amount varies</p>
              <p className="mt-1 text-balance text-sm text-muted-foreground">
                {bill.amount > 0
                  ? `Usually about ${money(bill.amount)} a ${per}`
                  : `Entered each ${per} when it comes due`}
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl font-bold tabular-nums tracking-tight">
                {money(bill.amount)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">every {per}</p>
            </>
          )}
        </div>

        <dl className="mt-4 divide-y rounded-2xl border">
          <DetailRow label="Next due">{capitalize(formatDueDate(bill.nextRun))}</DetailRow>
          <DetailRow label="Paid by">
            {/* Avatar trails the name, so a long name that wraps stays flush
                against it instead of leaving it stranded mid-row. On a narrow
                screen it gives way so the name can stay on one line. */}
            <span className="min-w-0 break-words">
              {bill.paidBy === currentUserId ? "You" : bill.paidByName}
            </span>
            <MemberAvatar
              id={bill.paidBy}
              name={bill.paidByName}
              className="hidden h-7 w-7 flex-shrink-0 min-[360px]:flex"
            />
          </DetailRow>
          <DetailRow label="Category">
            <CatIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" aria-hidden />
            {cat?.label ?? "Other"}
          </DetailRow>
          <DetailRow label="Split">{SPLIT_LABEL[bill.splitType] ?? bill.splitType}</DetailRow>
        </dl>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="mt-6 w-full border-destructive/40 text-destructive hover:bg-negative-soft hover:text-destructive"
          disabled={deleting}
          onClick={() => onDelete(bill.id)}
        >
          {deleting ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
          Delete recurring bill
        </Button>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Expenses it already logged stay put.
        </p>
      </SheetContent>
    </Sheet>
  );
}

export default function StatsPage() {
  const { version, mutate, currentUserId } = useAppData();
  const money = useMoney();
  const addExpense = useAddExpense();
  const { toast } = useToast();
  const expensesQ = useFetch<{ expenses: Expense[] }>("/api/expenses");
  const recurringQ = useFetch<{
    bills: RecurringBill[];
    pending: PendingRecurringCharge[];
  }>("/api/recurring");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  // The bill shown in the detail sheet. Kept after closing so the sheet's
  // content doesn't vanish mid-animation.
  const [viewing, setViewing] = React.useState<RecurringBill | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

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
  const pending = recurringQ.data?.pending ?? [];

  const { total, yourShare, byCategory, byPayer } = React.useMemo(() => {
    let total = 0;
    let yourShare = 0;
    const byCategory: Record<string, number> = {};
    const byPayer = new Map<string, { name: string; amount: number }>();
    for (const e of expenses) {
      total += e.amount;
      yourShare += e.splits.find((s) => s.userId === currentUserId)?.amount ?? 0;
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
      const prev = byPayer.get(e.paidBy);
      byPayer.set(e.paidBy, {
        name: e.paidByName,
        amount: (prev?.amount ?? 0) + e.amount,
      });
    }
    return { total, yourShare, byCategory, byPayer };
  }, [expenses, currentUserId]);

  const breakdown = CATEGORIES.map((c) => ({
    ...c,
    amount: byCategory[c.value] ?? 0,
  }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const payers = Array.from(byPayer.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.amount - a.amount);

  // What the fixed bills come to in a typical month (weekly ones × 52 / 12).
  const fixedBills = bills.filter((b) => b.amountType !== "variable");
  const hasWeekly = fixedBills.some((b) => b.frequency === "weekly");
  const fixedMonthly = fixedBills.reduce(
    (sum, b) => sum + (b.frequency === "weekly" ? (b.amount * 52) / 12 : b.amount),
    0,
  );

  function openBill(bill: RecurringBill) {
    setViewing(bill);
    setDetailOpen(true);
  }

  async function deleteBill(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/recurring?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast({ title: "Could not delete bill", variant: "error" });
        return;
      }
      toast({ title: "Recurring bill removed", variant: "success" });
      setDetailOpen(false);
      await recurringQ.refetch();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="duration-500 animate-in fade-in slide-in-from-bottom-3">
      <PageHeader
        title="Stats"
        subtitle={
          <span className="block text-balance">
            Where the household&apos;s money goes.
          </span>
        }
      />

      <div className="space-y-6">
        <PendingBillsCard
          pending={pending}
          onResolved={() => {
            mutate();
            void recurringQ.refetch();
          }}
        />

        {expensesQ.loading && !expensesQ.data ? (
          <SpendingSkeleton />
        ) : expensesQ.error && !expensesQ.data ? (
          <ErrorState
            title="Couldn't load stats"
            onRetry={() => void expensesQ.refetch()}
          />
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={PieChart}
            title="No spending yet"
            body="Add a shared expense and we'll chart where the money goes."
          >
            <Button type="button" onClick={addExpense} className="px-6">
              <Plus aria-hidden />
              Add expense
            </Button>
          </EmptyState>
        ) : (
          <>
            <section aria-label="Summary">
              <Card>
                <div className="p-4 pb-3">
                  <p className="text-sm text-muted-foreground">Total spent</p>
                  {/* One notch smaller on a narrow phone so a six-figure
                      total still sits on one line. */}
                  <p className="mt-1 break-words text-3xl font-bold tabular-nums tracking-tight min-[360px]:text-4xl">
                    {money(total)}
                  </p>
                </div>
                <dl className="divide-y border-t">
                  <SummaryRow label="Your share">{money(yourShare)}</SummaryRow>
                  <SummaryRow label="Expenses">{expenses.length}</SummaryRow>
                  <SummaryRow label="Average expense">
                    {money(total / expenses.length)}
                  </SummaryRow>
                </dl>
              </Card>
            </section>

            <section aria-labelledby="stats-categories">
              <SectionLabel id="stats-categories">Spending by category</SectionLabel>
              <Card>
                <ul className="divide-y">
                  {breakdown.map((c) => (
                    <BarRow
                      key={c.value}
                      leading={<IconTile icon={c.icon} />}
                      label={c.label}
                      amount={money(c.amount)}
                      part={c.amount}
                      total={total}
                    />
                  ))}
                </ul>
              </Card>
            </section>

            {payers.length > 0 && (
              <section aria-labelledby="stats-payers">
                <SectionLabel id="stats-payers">Who paid</SectionLabel>
                <Card>
                  <ul className="divide-y">
                    {payers.map((p) => (
                      <BarRow
                        key={p.id}
                        leading={
                          <MemberAvatar
                            id={p.id}
                            name={p.name}
                            className="h-10 w-10 flex-shrink-0"
                          />
                        }
                        label={
                          <>
                            {p.name}
                            {p.id === currentUserId && (
                              <span className="font-normal text-muted-foreground"> (you)</span>
                            )}
                          </>
                        }
                        amount={money(p.amount)}
                        part={p.amount}
                        total={total}
                      />
                    ))}
                  </ul>
                </Card>
              </section>
            )}
          </>
        )}

        <section aria-labelledby="stats-recurring">
          <SectionLabel id="stats-recurring">Recurring bills</SectionLabel>
          {recurringQ.loading && !recurringQ.data ? (
            <RecurringSkeleton />
          ) : recurringQ.error && !recurringQ.data ? (
            <ErrorState
              title="Couldn't load recurring bills"
              onRetry={() => void recurringQ.refetch()}
            />
          ) : bills.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="No recurring bills yet"
              body="Rent, internet, the electric bill: set it up once and it's split every time."
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(true)}
                className="px-6"
              >
                <Plus aria-hidden />
                Add recurring bill
              </Button>
            </EmptyState>
          ) : (
            <>
              <Card className="overflow-hidden">
                <ul className="divide-y">
                  {bills.map((b) => (
                    <RecurringRow key={b.id} bill={b} onOpen={openBill} />
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="flex min-h-14 w-full items-center gap-3 border-t px-4 py-3 text-left text-base font-semibold text-primary transition-colors [@media(hover:hover)]:hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:bg-accent"
                >
                  <Leading>
                    <IconTile icon={Plus} />
                  </Leading>
                  <Plus className="h-5 w-5 flex-shrink-0 min-[360px]:hidden" aria-hidden />
                  Add recurring bill
                </button>
              </Card>
              {fixedMonthly > 0 && (
                <p className="mt-2 text-balance px-1 text-sm text-muted-foreground">
                  Fixed bills come to{" "}
                  {hasWeekly ? "about " : ""}
                  <span className="font-semibold tabular-nums text-foreground">
                    {money(hasWeekly ? Math.round(fixedMonthly) : fixedMonthly)}
                  </span>{" "}
                  a month.
                </p>
              )}
            </>
          )}
        </section>
      </div>

      <RecurringBillSheet
        bill={viewing}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        deleting={viewing !== null && deleting === viewing.id}
        onDelete={(id) => void deleteBill(id)}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
          <SheetHeader className="mb-5">
            <SheetTitle>New recurring bill</SheetTitle>
            <SheetDescription>
              Set it up once and it&apos;s split every time it comes due.
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
