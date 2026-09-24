"use client";

import * as React from "react";
import { Loader2, Package, Paperclip } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ReceiptPicker } from "@/components/receipt-picker";
import { MoneyInput, FieldError, currencySymbol } from "@/components/split-editor";
import { useCurrency, useMoney } from "@/components/app-data";
import { useToast } from "@/components/ui/toaster";
import { CATEGORIES, type PendingRecurringCharge } from "@/lib/types";

/**
 * A YYYY-MM-DD schedule date as a phone-friendly phrase: "today", "tomorrow",
 * "yesterday", else "Sat, Sep 20" (plus the year when it isn't this year).
 * Read as a local calendar day, so it never slips back a day west of UTC.
 */
export function formatDueDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: y === today.getFullYear() ? undefined : "numeric",
  }).format(date);
}

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
    <section aria-labelledby="pending-bills-title">
      <div className="mb-2 flex items-center gap-2 px-1">
        <h2
          id="pending-bills-title"
          className="text-sm font-semibold text-muted-foreground"
        >
          {pending.length === 1 ? "A bill needs its amount" : "Bills that need an amount"}
        </h2>
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold tabular-nums text-primary-foreground">
          {pending.length}
        </span>
      </div>
      <div className="space-y-3">
        {pending.map((p) => (
          <PendingRow key={p.id} charge={p} onResolved={onResolved} />
        ))}
      </div>
    </section>
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
  const money = useMoney();
  const currency = useCurrency();
  const [amount, setAmount] = React.useState(
    charge.estimatedAmount > 0 ? charge.estimatedAmount.toFixed(2) : "",
  );
  const [receiptUrl, setReceiptUrl] = React.useState<string | null>(null);
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [busy, setBusy] = React.useState<"log" | "skip" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const cat = CATEGORIES.find((c) => c.value === charge.category);
  const CatIcon = cat?.icon ?? Package;
  const parsed = parseFloat(amount);
  const hasAmount = parsed > 0;

  async function log(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setError("Enter what the bill came to.");
      toast({ title: "Enter what the bill came to", variant: "error" });
      return;
    }
    setError(null);
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
  const titleId = `${inputId}-title`;
  const hintId = `${inputId}-hint`;
  const receiptOpen = showReceipt || receiptUrl !== null;
  const splitHint =
    charge.splitType === "percent" ? "split by percent" : "split equally";

  return (
    <Card className="border-primary/40 p-4">
      <form onSubmit={log} aria-labelledby={titleId} className="space-y-4">
        <div className="flex items-start gap-3">
          {/* The category tile gives way on a narrow screen so the title and
              due line get the full width. */}
          <span className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary min-[360px]:flex">
            <CatIcon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id={titleId} className="line-clamp-2 text-base font-semibold leading-snug">
              {charge.description}
            </h3>
            {/* Wraps between the two facts, never inside one. */}
            <p className="mt-0.5 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">
                Due {formatDueDate(charge.dueDate)} ·
              </span>{" "}
              <span className="inline-block">paid by {charge.paidByName}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={inputId}>What did it come to?</Label>
          <MoneyInput
            id={inputId}
            hero
            prefix={currencySymbol(currency)}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            invalid={Boolean(error)}
            aria-describedby={hintId}
          />
          {error ? (
            <FieldError id={hintId}>{error}</FieldError>
          ) : (
            <p id={hintId} className="text-sm text-muted-foreground">
              {charge.estimatedAmount > 0
                ? `Usually about ${money(charge.estimatedAmount)} · ${splitHint}`
                : `We'll log it ${splitHint}, as set up.`}
            </p>
          )}
        </div>

        {receiptOpen && (
          <ReceiptPicker value={receiptUrl} onChange={setReceiptUrl} />
        )}

        <div className="space-y-2">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={busy !== null}
          >
            {busy === "log" && <Loader2 className="animate-spin" aria-hidden />}
            {hasAmount ? `Log ${money(parsed)}` : "Log this bill"}
          </Button>
          {/* Side by side when they fit; each takes the full width when not. */}
          <div className="flex flex-wrap gap-2">
            {!receiptOpen && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-auto"
                onClick={() => setShowReceipt(true)}
              >
                <Paperclip aria-hidden />
                Attach the bill
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-auto text-muted-foreground"
              onClick={skip}
              disabled={busy !== null}
            >
              {busy === "skip" && <Loader2 className="animate-spin" aria-hidden />}
              {busy === "skip" ? "Skipping…" : "Skip this cycle"}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
