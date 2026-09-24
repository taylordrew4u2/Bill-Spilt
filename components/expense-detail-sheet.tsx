"use client";

import Image from "next/image";
import { ExternalLink, Pencil, Package, FileText, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import { useMoney } from "@/components/app-data";
import { CATEGORIES, type Expense } from "@/lib/types";
import { isPdfReceipt } from "@/components/receipt-picker";
import { cn } from "@/lib/utils";

const SPLIT_LABEL: Record<Expense["splitType"], string> = {
  equal: "Equally",
  percent: "By percentage",
  exact: "By exact amounts",
};

/** "Thursday, Sep 24" — with the year when it isn't this year. */
function longDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(d);
}

/** Steps the hero amount down for long figures ("CHF 123,456.78") so it still
 *  fits on one line in a 320px-wide sheet. */
function heroSize(formatted: string): string {
  if (formatted.length <= 11) return "text-5xl";
  if (formatted.length <= 14) return "text-4xl";
  return "text-3xl";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
      {children}
    </h3>
  );
}

/**
 * Detail view for a single expense: the amount, who paid, the split
 * breakdown plus the attached receipt — a photo or a PDF — if any, and the
 * edit / delete actions. Opened by tapping an expense row.
 */
export function ExpenseDetailSheet({
  expense,
  currentUserId,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  expense: Expense | null;
  currentUserId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (expense: Expense) => void;
  /** Called with the expense id once the user confirms the delete. */
  onDelete?: (id: string) => void;
}) {
  const money = useMoney();
  const cat = expense
    ? CATEGORIES.find((c) => c.value === expense.category)
    : null;
  const CatIcon = cat?.icon ?? Package;
  const amountText = expense ? money(expense.amount) : "";

  function confirmDelete(e: Expense) {
    if (!onDelete) return;
    if (!confirm(`Delete “${e.description}”? This can’t be undone.`)) return;
    onDelete(e.id);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
        {expense && (
          <>
            {/* Only the first row sits beside the close button, so only it
                needs to leave room for it; the title below gets full width. */}
            <SheetHeader className="pr-0">
              <div className="flex min-h-11 items-center gap-3 pr-12">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CatIcon className="h-5 w-5" aria-hidden />
                </div>
                <SheetDescription className="min-w-0">
                  <span className="block font-semibold text-foreground">
                    {cat?.label ?? "Other"}
                  </span>
                  <span className="block">{longDate(expense.createdAt)}</span>
                </SheetDescription>
              </div>
              <SheetTitle className="mt-3 leading-snug">{expense.description}</SheetTitle>
            </SheetHeader>

            <p
              className={cn(
                "mt-1 break-words font-bold tracking-tight tabular-nums",
                heroSize(amountText),
              )}
            >
              {amountText}
            </p>

            <dl className="mt-5 divide-y rounded-2xl border">
              <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2.5">
                <dt className="flex-shrink-0 text-sm text-muted-foreground">Paid by</dt>
                <dd className="flex min-w-0 items-center gap-2 text-base font-medium">
                  <MemberAvatar
                    id={expense.paidBy}
                    name={expense.paidByName}
                    className="h-8 w-8"
                  />
                  <span className="line-clamp-2 min-w-0 break-words">
                    {expense.paidBy === currentUserId ? "You" : expense.paidByName}
                  </span>
                </dd>
              </div>
              <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2.5">
                <dt className="flex-shrink-0 text-sm text-muted-foreground">Split</dt>
                <dd className="text-right text-base font-medium">
                  {SPLIT_LABEL[expense.splitType]}
                </dd>
              </div>
            </dl>

            {expense.createdBy !== null && expense.createdBy === currentUserId ? (
              <section className="mt-6">
                <SectionLabel>
                  Split between {expense.splits.length}{" "}
                  {expense.splits.length === 1 ? "person" : "people"}
                </SectionLabel>
                <ul className="divide-y rounded-2xl border">
                  {expense.splits.map((s) => (
                    <li
                      key={s.userId}
                      className="flex min-h-14 items-center gap-3 px-4 py-2.5"
                    >
                      <MemberAvatar id={s.userId} name={s.name} className="h-10 w-10" />
                      <span className="line-clamp-2 min-w-0 flex-1 break-words text-base font-medium">
                        {s.name}
                        {s.userId === currentUserId && (
                          <span className="font-normal text-muted-foreground"> (you)</span>
                        )}
                      </span>
                      <span className="flex-shrink-0 whitespace-nowrap text-base font-semibold tabular-nums">
                        {money(s.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <section className="mt-6">
                <SectionLabel>Your share</SectionLabel>
                {(() => {
                  const myShare = expense.splits.find((s) => s.userId === currentUserId);
                  return myShare ? (
                    <div className="flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-2.5">
                      <MemberAvatar
                        id={myShare.userId}
                        name={myShare.name}
                        className="h-10 w-10"
                      />
                      <span className="min-w-0 flex-1 truncate text-base font-medium">
                        You
                      </span>
                      <span className="flex-shrink-0 whitespace-nowrap text-lg font-semibold tabular-nums">
                        {money(myShare.amount)}
                      </span>
                    </div>
                  ) : (
                    <p className="flex min-h-14 items-center rounded-2xl border px-4 py-2.5 text-base text-muted-foreground">
                      You&apos;re not in this split
                    </p>
                  );
                })()}
                <p className="mt-2 px-1 text-sm text-muted-foreground">
                  Only the person who added this expense sees the full split.
                </p>
              </section>
            )}

            {expense.receiptUrl && (
              <section className="mt-6">
                <SectionLabel>Receipt</SectionLabel>
                {isPdfReceipt(expense.receiptUrl) ? (
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-2.5 transition-colors hover:bg-accent active:bg-accent"
                  >
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <FileText className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-base font-medium">
                      PDF receipt
                    </span>
                    <span className="flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-primary">
                      Open
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </span>
                  </a>
                ) : (
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open receipt photo in a new tab"
                    className="relative block overflow-hidden rounded-2xl border bg-muted"
                  >
                    <Image
                      src={expense.receiptUrl}
                      alt="Receipt"
                      width={600}
                      height={800}
                      className="h-auto max-h-72 w-full object-contain"
                      unoptimized
                    />
                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-card/95 px-3 py-1.5 text-sm font-semibold shadow">
                      Open
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </span>
                  </a>
                )}
              </section>
            )}

            {(onEdit || onDelete) && (
              <div className="mt-8 space-y-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => onEdit(expense)}
                  >
                    <Pencil aria-hidden />
                    Edit expense
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => confirmDelete(expense)}
                  >
                    <Trash2 aria-hidden />
                    Delete expense
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
