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
import { useAppData } from "@/components/app-data";
import { useOnline } from "@/lib/use-fetch";
import { queueExpense } from "@/lib/offline-db";
import { validateSplits } from "@/lib/settlement";
import { SplitEditor, buildSplits, type SplitState } from "@/components/split-editor";
import { ReceiptPicker } from "@/components/receipt-picker";
import { CATEGORIES, type SplitType, type ExpenseCategory, type Expense } from "@/lib/types";
import { roundMoney } from "@/lib/utils";

/**
 * Reconstruct editor split state from an existing expense (for editing).
 *
 * Editing is only offered when the viewer may see the figures, so `amount`
 * is present here; the fallback just keeps the maths total-safe.
 */
function splitStateFromExpense(expense: Expense): SplitState {
  const included = new Set(expense.splits.map((s) => s.userId));
  const values: Record<string, string> = {};
  const total = expense.amount ?? 0;
  if (expense.splitType === "exact") {
    for (const s of expense.splits) values[s.userId] = s.amount.toFixed(2);
  } else if (expense.splitType === "percent") {
    for (const s of expense.splits) {
      values[s.userId] =
        total > 0 ? String(Math.round((s.amount / total) * 100)) : "0";
    }
  }
  return { splitType: expense.splitType, included, values };
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
  const { toast } = useToast();
  const online = useOnline();
  const isEdit = Boolean(expense);

  const [description, setDescription] = React.useState(expense?.description ?? "");
  const [amount, setAmount] = React.useState(
    expense?.amount != null ? String(expense.amount) : "",
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

  React.useEffect(() => {
    if (currentUserId) setPaidBy((p) => p || currentUserId);
  }, [currentUserId]);

  const numericAmount = parseFloat(amount) || 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const splits = buildSplits(members, split);
    const err = validateSplits(numericAmount, split.splitType, splits);
    if (err) {
      toast({ title: err, variant: "error" });
      return;
    }
    if (!paidBy) {
      toast({ title: "Choose who paid", variant: "error" });
      return;
    }

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

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="desc">What for?</Label>
        <Input
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Groceries, rent, dinner…"
          required
          maxLength={140}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              className="pl-7"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as ExpenseCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <span className="flex items-center gap-2">
                    <c.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {c.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Paid by</Label>
        <Select value={paidBy} onValueChange={setPaidBy}>
          <SelectTrigger>
            <SelectValue placeholder="Who paid?" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.id === currentUserId ? `${m.name} (you)` : m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SplitEditor
        members={members}
        currentUserId={currentUserId}
        amount={numericAmount}
        state={split}
        onChange={setSplit}
      />

      <div className="space-y-1.5">
        <Label>Receipt (optional)</Label>
        <ReceiptPicker value={receiptUrl} onChange={setReceiptUrl} disabled={!online} />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isEdit ? "Save changes" : "Add expense"}
      </Button>
    </form>
  );
}
