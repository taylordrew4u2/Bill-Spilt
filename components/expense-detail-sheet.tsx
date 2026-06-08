"use client";

import Image from "next/image";
import { ExternalLink, Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MemberAvatar } from "@/components/member-avatar";
import { CATEGORIES, type Expense } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

/**
 * Read-only detail view for a single expense: full split breakdown plus the
 * attached receipt photo (if any). Opened by tapping an expense row.
 */
export function ExpenseDetailSheet({
  expense,
  currentUserId,
  open,
  onOpenChange,
  onEdit,
}: {
  expense: Expense | null;
  currentUserId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (expense: Expense) => void;
}) {
  const cat = expense
    ? CATEGORIES.find((c) => c.value === expense.category)
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
        {expense && (
          <>
            <SheetHeader className="mb-1">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl">
                  {cat?.emoji ?? "📦"}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate">{expense.description}</SheetTitle>
                  <SheetDescription>
                    {cat?.label ?? "Other"} · {formatDate(expense.createdAt)}
                  </SheetDescription>
                </div>
                <span className="ml-auto text-2xl font-extrabold">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            </SheetHeader>

            <p className="mt-3 text-sm text-muted-foreground">
              Paid by{" "}
              <span className="font-medium text-foreground">
                {expense.paidBy === currentUserId ? "you" : expense.paidByName}
              </span>{" "}
              · split{" "}
              {expense.splitType === "equal"
                ? "equally"
                : expense.splitType === "percent"
                  ? "by percentage"
                  : "by exact amounts"}
            </p>

            <Separator className="my-4" />

            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Split between
            </p>
            <ul className="space-y-1">
              {expense.splits.map((s) => (
                <li key={s.userId} className="flex items-center gap-3 py-1.5">
                  <MemberAvatar id={s.userId} name={s.name} className="h-8 w-8" />
                  <span className="flex-1 truncate text-sm">
                    {s.userId === currentUserId ? `${s.name} (you)` : s.name}
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrency(s.amount)}
                  </span>
                </li>
              ))}
            </ul>

            {expense.receiptUrl && (
              <>
                <Separator className="my-4" />
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Receipt
                </p>
                <a
                  href={expense.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block overflow-hidden rounded-xl border"
                >
                  <Image
                    src={expense.receiptUrl}
                    alt="Receipt"
                    width={600}
                    height={800}
                    className="h-auto max-h-72 w-full object-contain bg-muted"
                    unoptimized
                  />
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-medium shadow">
                    <ExternalLink className="h-3 w-3" /> Open
                  </span>
                </a>
              </>
            )}

            {onEdit && (
              <Button
                variant="outline"
                className="mt-5 w-full"
                onClick={() => onEdit(expense)}
              >
                <Pencil className="h-4 w-4" />
                Edit expense
              </Button>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
