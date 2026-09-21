"use client";

import * as React from "react";
import { CircleAlert, Loader2, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReceiptPicker } from "@/components/receipt-picker";
import { useToast } from "@/components/ui/toaster";
import type { PendingRecurringCharge } from "@/lib/types";

/**
 * Variable recurring bills (electric, water, wifi…) that have come due and are
 * waiting on the amount they actually landed at this cycle. Entering it logs
 * the expense with the bill's saved split; skipping drops the cycle.
 */
export function PendingBillsCard({
  pending,
  onResolved,
}: {
  pending: PendingRecurringCharge[];
  onResolved: () => void;
}) {
  if (pending.length === 0) return null;

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CircleAlert className="h-4 w-4 text-primary" />
          Needs an amount
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {pending.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.map((p) => (
          <PendingRow key={p.id} charge={p} onResolved={onResolved} />
        ))}
      </CardContent>
    </Card>
  );
}

function PendingRow({
  charge,
  onResolved,
}: {
  charge: PendingRecurringCharge;
  onResolved: () => void;
}) {
  const { toast } = useToast();
  // The typical amount is a pre-fill hint and only reaches the admin; for
  // everyone else it arrives as null and the field just starts empty.
  const [amount, setAmount] = React.useState(
    charge.estimatedAmount && charge.estimatedAmount > 0
      ? charge.estimatedAmount.toFixed(2)
      : "",
  );
  const [receiptUrl, setReceiptUrl] = React.useState<string | null>(null);
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [busy, setBusy] = React.useState<"log" | "skip" | null>(null);

  async function log(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast({ title: "Enter what the bill came to", variant: "error" });
      return;
    }
    setBusy("log");
    try {
      const res = await fetch(`/api/recurring/pending/${charge.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, receiptUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: data.error || "Could not log that bill", variant: "error" });
        return;
      }
      toast({ title: `${charge.description} logged`, variant: "success" });
      onResolved();
    } finally {
      setBusy(null);
    }
  }

  async function skip() {
    setBusy("skip");
    try {
      const res = await fetch(`/api/recurring/pending/${charge.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast({ title: "Could not skip that bill", variant: "error" });
        return;
      }
      toast({ title: "Skipped this cycle", variant: "success" });
      onResolved();
    } finally {
      setBusy(null);
    }
  }

  const inputId = `pending-${charge.id}`;

  return (
    <form onSubmit={log} className="space-y-2 rounded-xl border p-3">
      <div>
        <p className="font-medium">{charge.description}</p>
        <p className="text-xs text-muted-foreground">
          due {charge.dueDate} · paid by {charge.paidByName} ·{" "}
          {charge.splitType === "percent" ? "split by percent" : "split equally"}
        </p>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor={inputId} className="text-xs">
            What did it come to?
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id={inputId}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="pl-7"
            />
          </div>
        </div>
        <Button type="submit" disabled={busy !== null}>
          {busy === "log" && <Loader2 className="h-4 w-4 animate-spin" />}
          Log it
        </Button>
      </div>

      {showReceipt || receiptUrl ? (
        <ReceiptPicker value={receiptUrl} onChange={setReceiptUrl} />
      ) : (
        <button
          type="button"
          onClick={() => setShowReceipt(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground underline"
        >
          <Paperclip className="h-3.5 w-3.5" aria-hidden />
          Attach the bill
        </button>
      )}

      <button
        type="button"
        onClick={skip}
        disabled={busy !== null}
        className="block text-xs text-muted-foreground underline"
      >
        {busy === "skip" ? "Skipping…" : "Skip this one"}
      </button>
    </form>
  );
}
