"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency, roundMoney } from "@/lib/utils";

const TIP_PRESETS = [0, 15, 18, 20];

/**
 * A standalone, no-login bill splitter: enter a total, the number of people,
 * and an optional tip, and it shows the cent-accurate per-person amount.
 */
export function SplitCalculator() {
  const [amount, setAmount] = React.useState("");
  const [people, setPeople] = React.useState(2);
  const [tip, setTip] = React.useState(0);

  const subtotal = Math.max(0, parseFloat(amount) || 0);
  const tipAmount = roundMoney((subtotal * tip) / 100);
  const total = roundMoney(subtotal + tipAmount);

  // Cent-accurate even split: distribute the leftover pennies so the shares
  // always sum back to the total. `extra` people pay one cent more.
  const totalCents = Math.round(total * 100);
  const base = people > 0 ? Math.floor(totalCents / people) : 0;
  const extra = people > 0 ? totalCents - base * people : 0;
  const lowShare = base / 100;
  const highShare = (base + 1) / 100;

  const money = (n: number) => formatCurrency(n);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        {/* Amount */}
        <div className="space-y-1.5">
          <Label htmlFor="bill-amount">Total bill</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
              $
            </span>
            <Input
              id="bill-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 pl-7 text-lg"
              autoFocus
            />
          </div>
        </div>

        {/* People */}
        <div className="mt-5 space-y-1.5">
          <Label>Split between</Label>
          <div className="flex items-center justify-between rounded-lg border bg-background p-1.5">
            <button
              type="button"
              onClick={() => setPeople((p) => Math.max(1, p - 1))}
              disabled={people <= 1}
              aria-label="Fewer people"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent disabled:opacity-40"
            >
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <span aria-live="polite" className="text-base font-semibold">
              {people} {people === 1 ? "person" : "people"}
            </span>
            <button
              type="button"
              onClick={() => setPeople((p) => Math.min(50, p + 1))}
              disabled={people >= 50}
              aria-label="More people"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-5 space-y-1.5">
          <Label>Tip</Label>
          <div className="grid grid-cols-5 gap-2">
            {TIP_PRESETS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTip(t)}
                aria-pressed={tip === t}
                className={cn(
                  "h-10 rounded-md border text-sm font-medium transition-colors",
                  tip === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:bg-accent",
                )}
              >
                {t === 0 ? "None" : `${t}%`}
              </button>
            ))}
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              max="100"
              placeholder="%"
              aria-label="Custom tip percentage"
              value={TIP_PRESETS.includes(tip) ? "" : String(tip)}
              onChange={(e) => setTip(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
              className="h-10 px-2 text-center"
            />
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="mt-4 rounded-2xl bg-primary p-6 text-center text-primary-foreground shadow-sm">
        <p className="text-sm opacity-90">Each person pays</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">
          {money(extra > 0 ? highShare : lowShare)}
        </p>
        {extra > 0 && (
          <p className="mt-1 text-sm opacity-90">
            {extra} {extra === 1 ? "person pays" : "people pay"} {money(highShare)},{" "}
            {people - extra} {people - extra === 1 ? "pays" : "pay"} {money(lowShare)}
          </p>
        )}
        <div className="mt-4 flex items-center justify-center gap-4 border-t border-white/20 pt-3 text-sm opacity-90">
          <span>Subtotal {money(subtotal)}</span>
          {tipAmount > 0 && <span>Tip {money(tipAmount)}</span>}
          <span className="font-semibold opacity-100">Total {money(total)}</span>
        </div>
      </div>
    </div>
  );
}
