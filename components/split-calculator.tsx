"use client";

import * as React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/types";
import { cn, formatCurrency, roundMoney } from "@/lib/utils";

const TIP_PRESETS = [0, 15, 18, 20];
type Mode = "even" | "custom";
interface Person {
  key: number;
  name: string;
  amount: string;
}

/** Step the result figure down for long amounts (big bills, wordy currency
 *  symbols) so it never runs past the card on a 320px phone. */
function heroSize(text: string) {
  if (text.length <= 9) return "text-5xl";
  if (text.length <= 12) return "text-4xl";
  return "text-3xl";
}

/**
 * A standalone, no-login bill splitter. "Even" mode splits a total across N
 * people (cent-accurate); "Custom" mode lets each person owe a different
 * amount. An optional tip and a currency selector apply to both.
 */
export function SplitCalculator() {
  const [mode, setMode] = React.useState<Mode>("even");
  const [currency, setCurrency] = React.useState("USD");
  const [tip, setTip] = React.useState(0);

  // Even mode.
  const [amount, setAmount] = React.useState("");
  const [people, setPeople] = React.useState(2);

  // Custom mode.
  const rowKey = React.useRef(2);
  const [rows, setRows] = React.useState<Person[]>([
    { key: 0, name: "", amount: "" },
    { key: 1, name: "", amount: "" },
  ]);

  const money = React.useCallback(
    (n: number) => formatCurrency(n, currency),
    [currency],
  );
  const tipMult = 1 + tip / 100;

  // ---- Even split (distribute leftover pennies so shares sum to the total) ----
  const evenSubtotal = Math.max(0, parseFloat(amount) || 0);
  const evenTip = roundMoney(evenSubtotal * (tip / 100));
  const evenTotal = roundMoney(evenSubtotal + evenTip);
  const totalCents = Math.round(evenTotal * 100);
  const base = people > 0 ? Math.floor(totalCents / people) : 0;
  const extra = people > 0 ? totalCents - base * people : 0;
  const perPerson = money(extra > 0 ? (base + 1) / 100 : base / 100);

  // ---- Custom split (each person's amount + proportional tip) ----
  const customPeople = rows.map((r) => {
    const owed = Math.max(0, parseFloat(r.amount) || 0);
    return { ...r, total: roundMoney(owed * tipMult) };
  });
  const customSubtotal = roundMoney(
    rows.reduce((s, r) => s + Math.max(0, parseFloat(r.amount) || 0), 0),
  );
  const customTotal = roundMoney(customPeople.reduce((s, p) => s + p.total, 0));

  function updateRow(key: number, patch: Partial<Person>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  const customTip = !TIP_PRESETS.includes(tip);

  // Sits at the right of the first field's label row in both modes, so it's
  // always in the same place and never squeezes the mode switch.
  const currencySelect = (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger
        className="h-11 w-auto flex-shrink-0 gap-1.5 rounded-full border-0 bg-muted px-4 text-sm font-semibold focus:ring-offset-0"
        aria-label="Currency"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.symbol} {c.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <Card className="p-4 sm:p-6">
        {/* Mode switch — a full-width segmented control */}
        <div
          role="group"
          aria-label="Split mode"
          className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
        >
          {(["even", "custom"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={cn(
                "h-11 rounded-lg text-sm font-semibold transition-colors",
                mode === m
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "even" ? "Split evenly" : "Custom"}
            </button>
          ))}
        </div>

        {mode === "even" ? (
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="bill-amount">Total bill</Label>
                {currencySelect}
              </div>
              <CurrencyInput
                id="bill-amount"
                size="lg"
                currency={currency}
                value={amount}
                onChange={setAmount}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Split between</Label>
              <div className="flex items-center justify-between gap-3 rounded-2xl border bg-background p-2">
                <StepButton
                  onClick={() => setPeople((p) => Math.max(1, p - 1))}
                  disabled={people <= 1}
                  label="Fewer people"
                >
                  <Minus className="h-5 w-5" aria-hidden />
                </StepButton>
                <p aria-live="polite" className="flex min-w-0 items-baseline gap-1.5">
                  <span className="text-3xl font-bold tabular-nums tracking-tight">
                    {people}
                  </span>{" "}
                  <span className="text-base font-medium text-muted-foreground">
                    {people === 1 ? "person" : "people"}
                  </span>
                </p>
                <StepButton
                  onClick={() => setPeople((p) => Math.min(50, p + 1))}
                  disabled={people >= 50}
                  label="More people"
                >
                  <Plus className="h-5 w-5" aria-hidden />
                </StepButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label>Who owes what</Label>
              {currencySelect}
            </div>
            <ul className="space-y-5 min-[360px]:space-y-3">
              {rows.map((r, i) => (
                // One row from 360px up; on the narrowest phones the amount
                // drops under the name instead of squeezing both.
                <li
                  key={r.key}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 min-[360px]:grid-cols-[minmax(0,1fr)_7.5rem_auto]"
                >
                  <Input
                    value={r.name}
                    onChange={(e) => updateRow(r.key, { name: e.target.value })}
                    placeholder={`Person ${i + 1}`}
                    aria-label={`Name for person ${i + 1}`}
                    className="min-w-0 px-3"
                    maxLength={24}
                  />
                  <div className="order-last col-span-2 min-[360px]:order-none min-[360px]:col-span-1">
                    <CurrencyInput
                      currency={currency}
                      value={r.amount}
                      onChange={(v) => updateRow(r.key, { amount: v })}
                      ariaLabel={`Amount for ${r.name || `person ${i + 1}`}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                    disabled={rows.length <= 1}
                    aria-label={`Remove person ${i + 1}`}
                    className="flex h-12 w-11 flex-shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-destructive disabled:opacity-40"
                  >
                    <Trash2 className="h-5 w-5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setRows((rs) => [
                  ...rs,
                  { key: rowKey.current++, name: "", amount: "" },
                ])
              }
              className="w-full border-dashed text-primary hover:text-primary"
            >
              <Plus aria-hidden /> Add person
            </Button>
          </div>
        )}

        {/* Tip (shared) */}
        <div className="mt-6 space-y-2">
          <Label>Tip</Label>
          <div className="grid grid-cols-5 gap-1 rounded-xl bg-muted p-1">
            {TIP_PRESETS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTip(t)}
                aria-pressed={tip === t}
                className={cn(
                  "h-11 min-w-0 rounded-lg text-sm font-semibold tabular-nums transition-colors",
                  tip === t
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
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
              value={customTip ? String(tip) : ""}
              onChange={(e) =>
                setTip(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
              }
              className={cn(
                "h-11 min-w-0 rounded-lg border-0 px-1 text-center font-semibold tabular-nums [appearance:textfield] placeholder:font-semibold placeholder:text-muted-foreground focus-visible:bg-card focus-visible:ring-offset-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                customTip ? "bg-card shadow-sm" : "bg-transparent",
              )}
            />
          </div>
        </div>
      </Card>

      {/* Result */}
      <div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm sm:p-6">
        {mode === "even" ? (
          <div className="text-center">
            <p className="text-base font-medium text-primary-foreground/90">
              Each person pays
            </p>
            <p
              className={cn(
                "mt-1 font-bold tabular-nums tracking-tight",
                heroSize(perPerson),
              )}
            >
              {perPerson}
            </p>
            {extra > 0 && (
              <p className="mx-auto mt-2 max-w-xs text-balance text-sm text-primary-foreground/90">
                {extra} {extra === 1 ? "person pays" : "people pay"}{" "}
                {money((base + 1) / 100)}, {people - extra}{" "}
                {people - extra === 1 ? "pays" : "pay"} {money(base / 100)}
              </p>
            )}
          </div>
        ) : (
          <ul className="-my-1 divide-y divide-primary-foreground/20">
            {customPeople.map((p, i) => (
              <li
                key={p.key}
                className="flex min-h-12 items-center justify-between gap-3 py-2.5"
              >
                <span className="min-w-0 truncate text-base">
                  {p.name || `Person ${i + 1}`}
                </span>
                <span className="flex-shrink-0 whitespace-nowrap text-lg font-semibold tabular-nums">
                  {money(p.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <dl className="mt-5 grid grid-cols-2 divide-x divide-primary-foreground/20 border-t border-primary-foreground/20 pt-4 text-center">
          <div className="min-w-0 px-2">
            <dt className="text-sm text-primary-foreground/90">Subtotal</dt>
            <dd className="mt-0.5 break-words text-lg font-semibold tabular-nums">
              {money(mode === "even" ? evenSubtotal : customSubtotal)}
            </dd>
          </div>
          <div className="min-w-0 px-2">
            <dt className="text-sm text-primary-foreground/90">Total</dt>
            <dd className="mt-0.5 break-words text-lg font-bold tabular-nums">
              {money(mode === "even" ? evenTotal : customTotal)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/** A round, thumb-sized +/- button for the people stepper. */
function StepButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border bg-card text-foreground shadow-sm transition-[background-color,transform] hover:bg-accent active:scale-95 disabled:opacity-40 disabled:active:scale-100"
    >
      {children}
    </button>
  );
}

/** A money input with the active currency symbol as a prefix. The wrapper is
 *  a <label>, so tapping anywhere in the box (the symbol included) focuses the
 *  field; the symbol itself is hidden from the accessible name. */
function CurrencyInput({
  id,
  currency,
  value,
  onChange,
  ariaLabel,
  autoFocus,
  size = "default",
}: {
  id?: string;
  currency: string;
  value: string;
  onChange: (v: string) => void;
  ariaLabel?: string;
  autoFocus?: boolean;
  size?: "default" | "lg";
}) {
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "$";
  const lg = size === "lg";
  return (
    <label
      className={cn(
        "flex w-full cursor-text items-center border border-input bg-card transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30",
        lg ? "h-16 gap-2 rounded-2xl px-4" : "h-12 gap-1 rounded-xl px-3",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex-shrink-0 text-muted-foreground",
          lg ? "text-2xl font-semibold" : "text-base",
        )}
      >
        {symbol}
      </span>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        placeholder="0.00"
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        className={cn(
          "h-full min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 font-semibold tabular-nums [appearance:textfield] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          lg ? "text-3xl font-bold tracking-tight" : "text-base",
        )}
      />
    </label>
  );
}
