"use client";

import * as React from "react";
import { AlertCircle, Check } from "lucide-react";
import { cn, formatCurrency, roundMoney } from "@/lib/utils";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  type Member,
  type SplitType,
  type SplitInput,
} from "@/lib/types";

const SPLIT_TYPES: { value: SplitType; label: string }[] = [
  { value: "equal", label: "Equally" },
  { value: "exact", label: "Exact" },
  { value: "percent", label: "Percent" },
];

export interface SplitState {
  splitType: SplitType;
  included: Set<string>;
  values: Record<string, string>;
}

/** Build the API split payload from the current editor state. */
export function buildSplits(members: Member[], state: SplitState): SplitInput[] {
  return members
    .filter((m) => state.included.has(m.id))
    .map((m) => ({
      userId: m.id,
      value:
        state.splitType === "equal"
          ? undefined
          : parseFloat(state.values[m.id] || "0") || 0,
    }));
}

/** The symbol typed in front of an amount for a currency code ("$", "€", "CHF"). */
export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

type MoneyInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "prefix" | "size"
> & {
  /** Shown before the number, e.g. a currency symbol. */
  prefix?: string;
  /** Shown after the number, e.g. "%". */
  suffix?: string;
  /** The big amount field at the top of a form. Otherwise a compact field
   *  that sits at the end of a list row. */
  hero?: boolean;
  invalid?: boolean;
};

/**
 * A number field with its unit inside the box. The unit is part of the
 * layout (not an absolutely-positioned overlay), so a wide symbol like "CHF"
 * or "NZ$" never collides with the digits. Tapping anywhere in the box —
 * including the symbol — focuses the field.
 */
export function MoneyInput({
  prefix,
  suffix,
  hero,
  invalid,
  className,
  ...props
}: MoneyInputProps) {
  const ref = React.useRef<HTMLInputElement>(null);
  const unit = cn(
    "flex-shrink-0 text-muted-foreground",
    hero ? "text-2xl font-semibold" : "text-base",
  );
  return (
    <div
      onClick={() => ref.current?.focus()}
      className={cn(
        "flex cursor-text items-center border border-input bg-card transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30",
        hero ? "h-16 gap-2 rounded-2xl px-4" : "h-12 gap-1 rounded-xl px-3",
        invalid &&
          "border-destructive focus-within:border-destructive focus-within:ring-destructive/30",
        props.disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {prefix && (
        <span aria-hidden className={unit}>
          {prefix}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        {...props}
        className={cn(
          "h-full w-full min-w-0 flex-1 bg-transparent tabular-nums outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          hero
            ? "text-4xl font-bold tracking-tight"
            : "text-base font-semibold",
          // Digits sit against their unit: "$40", "50 %".
          !hero && suffix && "text-right",
        )}
      />
      {suffix && (
        <span aria-hidden className={unit}>
          {suffix}
        </span>
      )}
    </div>
  );
}

/** A validation message that sits directly under the field it's about. */
export function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/**
 * Reusable splitting UI: choose split type (equal / exact / percent), pick who
 * is involved, and (for non-equal types) enter each person's value. Shared by
 * the Add Expense and Recurring Bill forms.
 */
export function SplitEditor({
  members,
  currentUserId,
  amount,
  state,
  onChange,
  allowExact = true,
  amountLabel,
  currency = DEFAULT_CURRENCY,
  error,
}: {
  members: Member[];
  currentUserId: string | null;
  amount: number;
  state: SplitState;
  onChange: (next: SplitState) => void;
  /** Set false for a bill whose total changes each cycle — fixed dollar
   *  shares can't describe it, so only equal and percent are offered. The
   *  caller is responsible for not leaving "exact" selected. */
  allowExact?: boolean;
  /** Overrides the per-person preview when `amount` is only an estimate. */
  amountLabel?: string;
  /** Household currency code, for the symbols and previews. */
  currency?: string;
  /** A validation message about the split, shown under the list. */
  error?: string | null;
}) {
  const uid = React.useId();
  const types = allowExact
    ? SPLIT_TYPES
    : SPLIT_TYPES.filter((t) => t.value !== "exact");

  const { splitType } = state;
  const inMembers = members.filter((m) => state.included.has(m.id));
  const includedCount = inMembers.length;
  const equalShare =
    includedCount > 0 ? roundMoney(amount / includedCount) : 0;
  const money = (n: number) => formatCurrency(n, currency);
  const symbol = currencySymbol(currency);

  const numberFor = (id: string) => parseFloat(state.values[id] || "0") || 0;
  const assigned = roundMoney(
    inMembers.reduce((sum, m) => sum + numberFor(m.id), 0),
  );

  function setType(t: SplitType) {
    onChange({ ...state, splitType: t });
  }
  function toggle(id: string) {
    const next = new Set(state.included);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ ...state, included: next });
  }
  function setValue(id: string, v: string) {
    onChange({ ...state, values: { ...state.values, [id]: v } });
  }

  // Running total under the list, so "doesn't add up" is visible while you
  // type instead of only after pressing save.
  let total: React.ReactNode = null;
  let status: React.ReactNode = null;
  let tone: "ok" | "over" | "pending" = "pending";
  if (includedCount === 0) {
    total = "Tap a name to include them";
  } else if (splitType === "equal") {
    total = `${includedCount} of ${members.length} ${members.length === 1 ? "person" : "people"}`;
    status = amountLabel ?? `${money(equalShare)} each`;
  } else {
    const target = splitType === "percent" ? 100 : roundMoney(amount);
    const fmt = (n: number) => (splitType === "percent" ? `${n}%` : money(n));
    const left = roundMoney(target - assigned);
    if (splitType === "exact" && amount <= 0) {
      total = `${money(assigned)} assigned`;
    } else {
      total = `${fmt(assigned)} of ${fmt(target)}`;
      if (left === 0) {
        tone = "ok";
        status = "Adds up";
      } else if (left > 0) {
        status = `${fmt(left)} left`;
      } else {
        tone = "over";
        status = `${fmt(roundMoney(-left))} over`;
      }
    }
  }

  const errorId = `${uid}-error`;

  return (
    <div className="space-y-2">
      <p id={`${uid}-label`} className="text-sm font-semibold leading-snug">
        Split
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`${uid}-label`}
        className={cn(
          "grid gap-1 rounded-xl bg-muted p-1",
          types.length === 3 ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        {types.map((s) => {
          const active = splitType === s.value;
          return (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setType(s.value)}
              className={cn(
                "h-11 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-2xl border bg-card",
          error && "border-destructive",
        )}
      >
        <ul className="divide-y">
          {members.map((m) => {
            const isIn = state.included.has(m.id);
            const isYou = m.id === currentUserId;
            const showInput = isIn && splitType !== "equal";
            const pct = splitType === "percent" && isIn ? numberFor(m.id) : 0;
            return (
              // Under 360px a share field beside the name would squeeze it to
              // "Jordan Lee-…", so the field drops onto its own line instead.
              <li
                key={m.id}
                className={cn(
                  "flex min-h-14 items-center",
                  showInput && "max-xs:flex-wrap",
                )}
              >
                <label
                  className={cn(
                    "relative flex min-h-14 min-w-0 flex-1 cursor-pointer select-none items-center gap-3 py-2 pl-4 transition-colors active:bg-accent/60",
                    showInput ? "pr-2 max-xs:basis-full max-xs:pr-4" : "pr-4",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isIn}
                    onChange={() => toggle(m.id)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 ring-offset-2 ring-offset-card transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                      isIn
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-card",
                    )}
                  >
                    {isIn && <Check className="h-5 w-5" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "line-clamp-2 text-base font-medium",
                        !isIn && "text-muted-foreground",
                      )}
                    >
                      {m.name}
                      {isYou && (
                        <span className="font-normal text-muted-foreground"> (you)</span>
                      )}
                    </span>
                    {pct > 0 && amount > 0 && (
                      <span className="block text-sm tabular-nums text-muted-foreground">
                        {money(roundMoney((amount * pct) / 100))}
                      </span>
                    )}
                  </span>
                  {/* Everyone's equal share is also in the total below, so
                      on the narrowest screens the name gets the row. */}
                  {isIn && splitType === "equal" && (
                    <span
                      className={cn(
                        "flex-shrink-0 whitespace-nowrap tabular-nums max-xs:hidden",
                        amountLabel
                          ? "text-sm text-muted-foreground"
                          : "text-base font-semibold",
                        !amountLabel && amount <= 0 && "text-muted-foreground",
                      )}
                    >
                      {amountLabel ?? money(equalShare)}
                    </span>
                  )}
                </label>
                {showInput && (
                  <div className="flex-shrink-0 py-1 pr-4 max-xs:w-full max-xs:pb-3 max-xs:pl-14 max-xs:pt-0">
                    <MoneyInput
                      value={state.values[m.id] ?? ""}
                      onChange={(e) => setValue(m.id, e.target.value)}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder={splitType === "percent" ? "0" : "0.00"}
                      prefix={splitType === "exact" ? symbol : undefined}
                      suffix={splitType === "percent" ? "%" : undefined}
                      aria-label={`${m.name} ${splitType === "percent" ? "percentage" : "amount"}`}
                      className={cn(
                        "w-24 max-xs:w-40",
                        splitType === "exact" && "xs:w-28",
                      )}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <div
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t bg-muted/50 px-4 py-3 text-sm"
        >
          <span
            className={cn(
              "tabular-nums",
              includedCount === 0 ? "font-medium text-destructive" : "text-muted-foreground",
            )}
          >
            {total}
          </span>
          {status && (
            <span
              className={cn(
                "flex items-center gap-1 whitespace-nowrap font-semibold tabular-nums",
                tone === "ok" && "text-positive",
                tone === "over" && "text-destructive",
                tone === "pending" && "text-foreground",
              )}
            >
              {tone === "ok" && <Check className="h-4 w-4" strokeWidth={3} aria-hidden />}
              {status}
            </span>
          )}
        </div>
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
