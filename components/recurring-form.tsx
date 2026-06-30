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
import { validateSplits } from "@/lib/settlement";
import { SplitEditor, buildSplits, type SplitState } from "@/components/split-editor";
import { CATEGORIES, type SplitType, type ExpenseCategory } from "@/lib/types";
import { roundMoney } from "@/lib/utils";

export function RecurringForm({ onDone }: { onDone: () => void }) {
  const { members, currentUserId } = useAppData();
  const { toast } = useToast();

  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState<ExpenseCategory>("rent");
  const [paidBy, setPaidBy] = React.useState(currentUserId ?? "");
  const [frequency, setFrequency] = React.useState<"weekly" | "monthly">("monthly");
  const [split, setSplit] = React.useState<SplitState>({
    splitType: "equal" as SplitType,
    included: new Set(members.map((m) => m.id)),
    values: {},
  });
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
    setSubmitting(true);
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          amount: roundMoney(numericAmount),
          category,
          splitType: split.splitType,
          paidBy,
          frequency,
          splits,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: data.error || "Could not save bill", variant: "error" });
        return;
      }
      toast({ title: "Recurring bill added", variant: "success" });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="rdesc">Bill name</Label>
        <Input
          id="rdesc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Rent, Internet, Netflix…"
          required
          maxLength={140}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ramount">Amount</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="ramount"
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
          <Label>Frequency</Label>
          <Select
            value={frequency}
            onValueChange={(v) => setFrequency(v as "weekly" | "monthly")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        <div className="space-y-1.5">
          <Label>Paid by</Label>
          <Select value={paidBy} onValueChange={setPaidBy}>
            <SelectTrigger>
              <SelectValue placeholder="Who pays?" />
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
      </div>

      <SplitEditor
        members={members}
        currentUserId={currentUserId}
        amount={numericAmount}
        state={split}
        onChange={setSplit}
      />

      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Save recurring bill
      </Button>
    </form>
  );
}
