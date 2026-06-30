"use client";

import * as React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
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

  const currencySelect = (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger className="h-9 w-[104px]" aria-label="Currency">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.symbol} {c.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        {/* Mode toggle + currency */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex rounded-lg bg-muted p-1">
            {(["even", "custom"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={cn(
                  "h-8 rounded-md px-3 text-sm font-medium transition-colors",
                  mode === m
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {m === "even" ? "Split evenly" : "Custom"}
              </button>
            ))}
          </div>
          {currencySelect}
        </div>

        {mode === "even" ? (
          <>
            <div className="mt-5 space-y-1.5">
              <Label htmlFor="bill-amount">Total bill</Label>
              <CurrencyInput
                id="bill-amount"
                currency={currency}
                value={amount}
                onChange={setAmount}
                autoFocus
              />
            </div>
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
          </>
        ) : (
          <div className="mt-5 space-y-2">
            <Label>Who owes what</Label>
            <ul className="space-y-2">
              {rows.map((r, i) => (
                <li key={r.key} className="flex items-center gap-2">
                  <Input
                    value={r.name}
                    onChange={(e) => updateRow(r.key, { name: e.target.value })}
                    placeholder={`Person ${i + 1}`}
                    aria-label={`Name for person ${i + 1}`}
                    className="h-11 flex-1"
                    maxLength={24}
                  />
                  <div className="w-28">
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
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() =>
                setRows((rs) => [
                  ...rs,
                  { key: rowKey.current++, name: "", amount: "" },
                ])
              }
              className="flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              <Plus className="h-4 w-4" aria-hidden /> Add person
            </button>
          </div>
        )}

        {/* Tip (shared) */}
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
              onChange={(e) =>
                setTip(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
              }
              className="h-10 px-2 text-center"
            />
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="mt-4 rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm">
        {mode === "even" ? (
          <div className="text-center">
            <p className="text-sm opacity-90">Each person pays</p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight">
              {money(extra > 0 ? (base + 1) / 100 : base / 100)}
            </p>
            {extra > 0 && (
              <p className="mt-1 text-sm opacity-90">
                {extra} {extra === 1 ? "person pays" : "people pay"}{" "}
                {money((base + 1) / 100)}, {people - extra}{" "}
                {people - extra === 1 ? "pays" : "pay"} {money(base / 100)}
              </p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-white/20">
            {customPeople.map((p, i) => (
              <li key={p.key} className="flex items-center justify-between py-2">
                <span className="truncate opacity-95">
                  {p.name || `Person ${i + 1}`}
                </span>
                <span className="font-semibold">{money(p.total)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex items-center justify-center gap-4 border-t border-white/20 pt-3 text-sm opacity-90">
          <span>
            Subtotal {money(mode === "even" ? evenSubtotal : customSubtotal)}
          </span>
          <span className="font-semibold opacity-100">
            Total {money(mode === "even" ? evenTotal : customTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}

/** A money input with the active currency symbol as a prefix. */
function CurrencyInput({
  id,
  currency,
  value,
  onChange,
  ariaLabel,
  autoFocus,
}: {
  id?: string;
  currency: string;
  value: string;
  onChange: (v: string) => void;
  ariaLabel?: string;
  autoFocus?: boolean;
}) {
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "$";
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
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
        className="h-11 pl-7 text-right"
      />
    </div>
  );
}
