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
import { StickySubmit } from "@/components/expense-form";
import { validateSplits, validateSplitShape } from "@/lib/settlement";
import {
  SplitEditor,
  MoneyInput,
  FieldError,
  buildSplits,
  currencySymbol,
  type SplitState,
} from "@/components/split-editor";
import {
  CATEGORIES,
  type SplitType,
  type ExpenseCategory,
  type RecurringAmountType,
} from "@/lib/types";
import { cn, roundMoney } from "@/lib/utils";

const AMOUNT_TYPES: {
  value: RecurringAmountType;
  label: string;
  hint: string;
}[] = [
  { value: "fixed", label: "Same every time", hint: "Rent, subscriptions" },
  { value: "variable", label: "Changes each time", hint: "Electric, water, wifi" },
];

const FREQUENCIES: { value: "weekly" | "monthly"; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function RecurringForm({ onDone }: { onDone: () => void }) {
  const { members, currentUserId } = useAppData();
  const currency = useCurrency();
  const { toast } = useToast();
  const uid = React.useId();

  const [description, setDescription] = React.useState("");
  const [amountType, setAmountType] = React.useState<RecurringAmountType>("fixed");
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
  // The last validation problem, shown under the field it's about.
  const [error, setError] = React.useState<{
    field: "amount" | "split";
    message: string;
  } | null>(null);

  React.useEffect(() => {
    if (currentUserId) setPaidBy((p) => p || currentUserId);
  }, [currentUserId]);

  // The submit button is pinned to the bottom of the sheet, so scroll the
  // field at fault into view.
  React.useEffect(() => {
    if (!error) return;
    document
      .getElementById(`${uid}-${error.field}`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [error, uid]);

  const numericAmount = parseFloat(amount) || 0;
  const isVariable = amountType === "variable";

  /** Exact dollar shares can't describe a total that changes, so switching to
   *  a variable amount falls back to an equal split. */
  function chooseAmountType(next: RecurringAmountType) {
    setAmountType(next);
    setError(null);
    if (next === "variable" && split.splitType === "exact") {
      setSplit({ ...split, splitType: "equal" });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const splits = buildSplits(members, split);
    // A variable bill has no total yet, so only the split shape is checked now;
    // the amount is validated when the bill comes due.
    const err = isVariable
      ? validateSplitShape(split.splitType, splits)
      : validateSplits(numericAmount, split.splitType, splits);
    if (err) {
      // validateSplits checks "anyone included?" before "amount > 0".
      setError({
        field:
          !isVariable && splits.length > 0 && numericAmount <= 0 ? "amount" : "split",
        message: err,
      });
      toast({ title: err, variant: "error" });
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          amountType,
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
      toast({
        title: "Recurring bill added",
        description: isVariable
          ? "We'll ask for the amount each time it's due."
          : undefined,
        variant: "success",
      });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  const amountError = error?.field === "amount" ? error.message : null;

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={`${uid}-desc`}>Bill name</Label>
        <Input
          id={`${uid}-desc`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Rent, Internet, Netflix…"
          required
          maxLength={140}
          autoFocus
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <p id={`${uid}-type`} className="text-sm font-semibold leading-snug">
          Does the amount change?
        </p>
        <div
          role="radiogroup"
          aria-labelledby={`${uid}-type`}
          className="divide-y overflow-hidden rounded-2xl border bg-card"
        >
          {AMOUNT_TYPES.map((t) => {
            const active = amountType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => chooseAmountType(t.value)}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  active ? "bg-primary/5" : "hover:bg-accent/60",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    active ? "border-primary" : "border-input",
                  )}
                >
                  {active && <span className="h-3 w-3 rounded-full bg-primary" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-medium">{t.label}</span>
                  <span className="block text-sm text-muted-foreground">{t.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
        {isVariable && (
          <p className="text-sm text-muted-foreground">
            We&apos;ll ask someone for the real amount every time this bill is due.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${uid}-amount-input`}>
          {isVariable ? (
            <>
              Typical amount
              <span className="ml-2 font-normal text-muted-foreground">Optional</span>
            </>
          ) : (
            "Amount"
          )}
        </Label>
        <MoneyInput
          id={`${uid}-amount-input`}
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
          required={!isVariable}
          placeholder="0.00"
          invalid={Boolean(amountError)}
          aria-describedby={amountError ? `${uid}-amount` : undefined}
        />
        {amountError && <FieldError id={`${uid}-amount`}>{amountError}</FieldError>}
      </div>

      <div className="space-y-2">
        <p id={`${uid}-freq`} className="text-sm font-semibold leading-snug">
          How often
        </p>
        <div
          role="radiogroup"
          aria-labelledby={`${uid}-freq`}
          className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
        >
          {FREQUENCIES.map((f) => {
            const active = frequency === f.value;
            return (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setFrequency(f.value)}
                className={cn(
                  "h-11 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
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
        <Select value={paidBy} onValueChange={setPaidBy}>
          <SelectTrigger id={`${uid}-paid-by`}>
            <SelectValue placeholder="Who pays?" />
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
      </div>

      <div id={`${uid}-split`}>
        <SplitEditor
          members={members}
          currentUserId={currentUserId}
          amount={numericAmount}
          state={split}
          onChange={(next) => {
            setSplit(next);
            setError(null);
          }}
          allowExact={!isVariable}
          amountLabel={isVariable && numericAmount <= 0 ? "even share" : undefined}
          currency={currency}
          error={error?.field === "split" ? error.message : null}
        />
      </div>

      <StickySubmit>
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" aria-hidden />}
          Save recurring bill
        </Button>
      </StickySubmit>
    </form>
  );
}
