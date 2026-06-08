import { roundMoney } from "@/lib/utils";
import type {
  Balance,
  Member,
  SettlementTransfer,
  SplitInput,
  SplitType,
} from "@/lib/types";

/**
 * Compute the exact split amounts owed by each participant for one expense.
 *
 * - equal:   split evenly, remainder cents distributed to the first members
 *            so the total always reconciles to `amount`.
 * - exact:   each `value` is a dollar amount; must sum to `amount`.
 * - percent: each `value` is a percentage 0-100; must sum to 100.
 *
 * Returns a map of userId -> amount owed (their share of the expense).
 */
export function computeSplits(
  amount: number,
  splitType: SplitType,
  splits: SplitInput[],
): Record<string, number> {
  if (splits.length === 0) return {};
  const result: Record<string, number> = {};

  if (splitType === "equal") {
    const cents = Math.round(amount * 100);
    const base = Math.floor(cents / splits.length);
    let remainder = cents - base * splits.length;
    for (const s of splits) {
      let share = base;
      if (remainder > 0) {
        share += 1;
        remainder -= 1;
      }
      result[s.userId] = share / 100;
    }
    return result;
  }

  if (splitType === "percent") {
    const cents = Math.round(amount * 100);
    let allocated = 0;
    splits.forEach((s, i) => {
      if (i === splits.length - 1) {
        result[s.userId] = (cents - allocated) / 100;
      } else {
        const share = Math.round((cents * (s.value ?? 0)) / 100);
        allocated += share;
        result[s.userId] = share / 100;
      }
    });
    return result;
  }

  // exact
  for (const s of splits) {
    result[s.userId] = roundMoney(s.value ?? 0);
  }
  return result;
}

/** Validate a split payload, returning an error message or null. */
export function validateSplits(
  amount: number,
  splitType: SplitType,
  splits: SplitInput[],
): string | null {
  if (splits.length === 0) return "At least one person must be included in the split.";
  if (amount <= 0) return "Amount must be greater than zero.";

  if (splitType === "exact") {
    const total = roundMoney(splits.reduce((s, x) => s + (x.value ?? 0), 0));
    if (total !== roundMoney(amount)) {
      return `Exact amounts must add up to ${roundMoney(amount)} (got ${total}).`;
    }
  }
  if (splitType === "percent") {
    const total = roundMoney(splits.reduce((s, x) => s + (x.value ?? 0), 0));
    if (total !== 100) {
      return `Percentages must add up to 100% (got ${total}%).`;
    }
  }
  return null;
}

/**
 * Given the list of net balances (positive = owed money, negative = owes
 * money), produce a minimal set of transfers that settles everyone up.
 *
 * Uses the classic greedy "min cash flow" heuristic: repeatedly match the
 * largest creditor with the largest debtor. This produces at most N-1
 * transfers for N people and in practice a very short list.
 */
export function minimizeTransfers(balances: Balance[]): SettlementTransfer[] {
  const EPS = 0.005; // half a cent
  const nameOf = new Map(balances.map((b) => [b.userId, b.name]));

  // Work in cents (integers) to avoid floating point accumulation errors.
  const creditors: { id: string; amt: number }[] = [];
  const debtors: { id: string; amt: number }[] = [];
  for (const b of balances) {
    const cents = Math.round(b.net * 100);
    if (cents > 0) creditors.push({ id: b.userId, amt: cents });
    else if (cents < 0) debtors.push({ id: b.userId, amt: -cents });
  }

  // Max-heaps approximated with sort each iteration (N <= 12, trivial).
  const transfers: SettlementTransfer[] = [];
  while (creditors.length && debtors.length) {
    creditors.sort((a, b) => b.amt - a.amt);
    debtors.sort((a, b) => b.amt - a.amt);
    const c = creditors[0];
    const d = debtors[0];
    const pay = Math.min(c.amt, d.amt);

    transfers.push({
      from: d.id,
      fromName: nameOf.get(d.id) ?? "Unknown",
      to: c.id,
      toName: nameOf.get(c.id) ?? "Unknown",
      amount: pay / 100,
    });

    c.amt -= pay;
    d.amt -= pay;
    if (c.amt < EPS * 100) creditors.shift();
    if (d.amt < EPS * 100) debtors.shift();
  }

  return transfers;
}

/**
 * Aggregate raw splits + payments into net balances per member.
 * `paid[userId]` is how much that member paid out; `owed[userId]` is the
 * total of their shares across all expenses. Net = paid - owed.
 */
export function computeBalances(
  members: Member[],
  paid: Record<string, number>,
  owed: Record<string, number>,
): Balance[] {
  return members.map((m) => ({
    userId: m.id,
    name: m.name,
    net: roundMoney((paid[m.id] ?? 0) - (owed[m.id] ?? 0)),
  }));
}
