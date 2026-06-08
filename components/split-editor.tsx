"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn, roundMoney } from "@/lib/utils";
import type { Member, SplitType, SplitInput } from "@/lib/types";

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
}: {
  members: Member[];
  currentUserId: string | null;
  amount: number;
  state: SplitState;
  onChange: (next: SplitState) => void;
}) {
  const includedCount = state.included.size;
  const equalShare =
    includedCount > 0 ? roundMoney(amount / includedCount) : 0;

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

  return (
    <div className="space-y-2">
      <Label>Split</Label>
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-1">
        {SPLIT_TYPES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setType(s.value)}
            className={cn(
              "h-9 rounded-lg text-sm font-medium transition",
              state.splitType === s.value
                ? "bg-background shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <ul className="space-y-1.5 pt-1">
        {members.map((m) => {
          const isIn = state.included.has(m.id);
          return (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-lg border p-2.5"
            >
              <button
                type="button"
                onClick={() => toggle(m.id)}
                className={cn(
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border",
                  isIn
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input",
                )}
                aria-pressed={isIn}
              >
                {isIn && <Check className="h-4 w-4" />}
              </button>
              <span className="flex-1 truncate text-sm">
                {m.id === currentUserId ? `${m.name} (you)` : m.name}
              </span>
              {isIn && state.splitType === "equal" && (
                <span className="text-sm text-muted-foreground">
                  ${equalShare.toFixed(2)}
                </span>
              )}
              {isIn && state.splitType !== "equal" && (
                <div className="relative w-24">
                  {state.splitType === "exact" && (
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      $
                    </span>
                  )}
                  <Input
                    value={state.values[m.id] ?? ""}
                    onChange={(e) => setValue(m.id, e.target.value)}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder={state.splitType === "percent" ? "%" : "0.00"}
                    className={cn(
                      "h-9 text-right",
                      state.splitType === "exact" && "pl-5",
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
