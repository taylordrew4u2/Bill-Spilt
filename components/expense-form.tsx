"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { useAppData, useCurrency } from "@/components/app-data";
import { MemberAvatar } from "@/components/member-avatar";
import { useOnline } from "@/lib/use-fetch";
import { queueExpense } from "@/lib/offline-db";
import { validateSplits } from "@/lib/settlement";
import {
  SplitEditor,
  MoneyInput,
  FieldError,
  buildSplits,
  currencySymbol,
  type SplitState,
} from "@/components/split-editor";
import { ReceiptPicker } from "@/components/receipt-picker";
import { CATEGORIES, type SplitType, type ExpenseCategory, type Expense } from "@/lib/types";
import { roundMoney } from "@/lib/utils";

/** Reconstruct editor split state from an existing expense (for editing). */
function splitStateFromExpense(expense: Expense): SplitState {
  const included = new Set(expense.splits.map((s) => s.userId));
  const values: Record<string, string> = {};
  if (expense.splitType === "exact") {
    for (const s of expense.splits) values[s.userId] = s.amount.toFixed(2);
  } else if (expense.splitType === "percent") {
    for (const s of expense.splits) {
      values[s.userId] =
        expense.amount > 0
          ? String(Math.round((s.amount / expense.amount) * 100))
          : "0";
    }
  }
  return { splitType: expense.splitType, included, values };
}

type FieldKey = "amount" | "paidBy" | "split";

/**
 * The primary action of a long form, pinned to the bottom of the sheet while
 * you scroll so it's always one tap away. Shared with the recurring form.
 */
export function StickySubmit({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 bg-card px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 before:pointer-events-none before:absolute before:inset-x-0 before:-top-5 before:h-5 before:bg-gradient-to-t before:from-card before:to-transparent">
      {children}
    </div>
  );
}

export function ExpenseForm({
  onDone,
  expense,
}: {
  onDone: () => void;
  /** When provided, the form edits this expense instead of creating one. */
  expense?: Expense;
}) {
  const { members, currentUserId, household, mutate } = useAppData();
  const currency = useCurrency();
  const { toast } = useToast();
  const online = useOnline();
  const isEdit = Boolean(expense);
  const uid = React.useId();

  const [description, setDescription] = React.useState(expense?.description ?? "");
  const [amount, setAmount] = React.useState(
    expense ? expense.amount.toFixed(2) : "",
  );
  const [category, setCategory] = React.useState<ExpenseCategory>(
    expense?.category ?? "groceries",
  );
  const [paidBy, setPaidBy] = React.useState(
    expense?.paidBy ?? currentUserId ?? "",
  );
  const [split, setSplit] = React.useState<SplitState>(
    expense
      ? splitStateFromExpense(expense)
      : {
          splitType: "equal" as SplitType,
          included: new Set(members.map((m) => m.id)),
          values: {},
        },
  );
  const [receiptUrl, setReceiptUrl] = React.useState<string | null>(
    expense?.receiptUrl ?? null,
  );
  const [submitting, setSubmitting] = React.useState(false);
  // The last validation problem, shown under the field it's about. Cleared as
  // soon as that part of the form is touched again.
  const [error, setError] = React.useState<{ field: FieldKey; message: string } | null>(
    null,
  );

  React.useEffect(() => {
    if (currentUserId) setPaidBy((p) => p || currentUserId);
  }, [currentUserId]);

  // Bring the message into view: the submit button is pinned to the bottom,
  // so the field at fault may be scrolled well above it.
  React.useEffect(() => {
    if (!error) return;
    document
      .getElementById(`${uid}-${error.field}`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [error, uid]);

  const numericAmount = parseFloat(amount) || 0;
  const errorFor = (field: FieldKey) =>
    error?.field === field ? error.message : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const splits = buildSplits(members, split);
    const err = validateSplits(numericAmount, split.splitType, splits);
    if (err) {
      // validateSplits checks "anyone included?" before "amount > 0".
      setError({
        field: splits.length > 0 && numericAmount <= 0 ? "amount" : "split",
        message: err,
      });
      toast({ title: err, variant: "error" });
      return;
    }
    if (!paidBy) {
      setError({ field: "paidBy", message: "Choose who paid" });
      toast({ title: "Choose who paid", variant: "error" });
      return;
    }
    setError(null);

    const payload = {
      description: description.trim(),
      amount: roundMoney(numericAmount),
      category,
      splitType: split.splitType,
      paidBy,
      splits,
      receiptUrl,
      createdAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      if (isEdit && expense) {
        // Editing requires connectivity (no offline queue for edits).
        if (!online) {
          toast({ title: "You're offline — can't edit right now", variant: "error" });
          return;
        }
        const res = await fetch(`/api/expenses/${expense.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast({ title: data.error || "Could not save changes", variant: "error" });
          return;
        }
        toast({ title: "Changes saved", variant: "success" });
        mutate();
        onDone();
        return;
      }

      if (!online) {
        await queueExpense({ ...payload, householdId: household?.id ?? "" });
        toast({
          title: "Saved offline",
          description: "It'll sync automatically when you reconnect.",
          variant: "success",
        });
        mutate();
        onDone();
        return;
      }

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: data.error || "Could not add expense", variant: "error" });
        return;
      }
      toast({ title: "Expense added", variant: "success" });
      mutate();
      onDone();
    } catch {
      if (isEdit) {
        toast({ title: "Could not save changes", variant: "error" });
        return;
      }
      // Network died mid-request — fall back to the offline queue.
      await queueExpense({ ...payload, householdId: household?.id ?? "" });
      toast({ title: "Saved offline", variant: "success" });
      mutate();
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  const amountError = errorFor("amount");
  const paidByError = errorFor("paidBy");

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={`${uid}-desc`}>What for?</Label>
        <Input
          id={`${uid}-desc`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Groceries, rent, dinner…"
          required
          maxLength={140}
          autoFocus
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${uid}-amount-input`}>Amount</Label>
        <MoneyInput
          id={`${uid}-amount-input`}
          hero
          prefix={currencySymbol(currency)}
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            // The amount also decides whether exact shares add up.
            if (error?.field === "amount" || error?.field === "split") setError(null);
          }}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
          placeholder="0.00"
          invalid={Boolean(amountError)}
          aria-describedby={amountError ? `${uid}-amount` : undefined}
        />
        {amountError && <FieldError id={`${uid}-amount`}>{amountError}</FieldError>}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${uid}-category`}>Category</Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as ExpenseCategory)}
        >
          <SelectTrigger id={`${uid}-category`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                <span className="flex items-center gap-3">
                  <c.icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" aria-hidden />
                  {c.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${uid}-paid-by`}>Paid by</Label>
        <Select
          value={paidBy}
          onValueChange={(v) => {
            setPaidBy(v);
            if (error?.field === "paidBy") setError(null);
          }}
        >
          <SelectTrigger
            id={`${uid}-paid-by`}
            aria-invalid={paidByError ? true : undefined}
            aria-describedby={paidByError ? `${uid}-paidBy` : undefined}
            className={paidByError ? "border-destructive" : undefined}
          >
            <SelectValue placeholder="Who paid?" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <span className="flex min-w-0 items-center gap-3">
                  <MemberAvatar id={m.id} name={m.name} className="h-7 w-7" />
                  <span className="truncate">
                    {m.id === currentUserId ? `${m.name} (you)` : m.name}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {paidByError && <FieldError id={`${uid}-paidBy`}>{paidByError}</FieldError>}
      </div>

      <div id={`${uid}-split`}>
        <SplitEditor
          members={members}
          currentUserId={currentUserId}
          amount={numericAmount}
          state={split}
          onChange={(next) => {
            setSplit(next);
            if (error?.field === "split") setError(null);
          }}
          currency={currency}
          error={errorFor("split")}
        />
      </div>

      <div className="space-y-2">
        <p className="flex items-baseline gap-2 text-sm font-semibold leading-snug">
          Receipt
          <span className="font-normal text-muted-foreground">Optional</span>
        </p>
        <ReceiptPicker value={receiptUrl} onChange={setReceiptUrl} disabled={!online} />
      </div>

      <StickySubmit>
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" aria-hidden />}
          {isEdit ? "Save changes" : "Add expense"}
        </Button>
      </StickySubmit>
    </form>
  );
}
