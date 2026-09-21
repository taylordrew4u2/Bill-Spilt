/**
 * Who is allowed to see a money figure.
 *
 * The ledger exists to document that each person paid their share — not to
 * publish what the house spends. So amounts are private by default:
 *
 *   - The household admin (owner) keeps the books and sees every figure.
 *   - Everyone else sees only money that is theirs: their own share of an
 *     expense, their own balance, and transfers/settlements they are part of.
 *     They also keep the totals of expenses they paid or logged themselves,
 *     since that is money they handled.
 *   - Nobody but the admin sees household-wide totals ("total spent", what
 *     each member has spent overall). Those live in the admin CSV export.
 *
 * Redaction happens on the server, before the JSON leaves the route, so a
 * hidden amount is never sent to a browser that shouldn't have it. A redacted
 * figure comes back as `null` rather than 0, so the UI can say "hidden"
 * instead of quietly showing the wrong number.
 */

import { CURRENCIES } from "@/lib/types";
import type {
  Expense,
  PendingRecurringCharge,
  RecurringBill,
  SettlementRecord,
  SettlementTransfer,
} from "@/lib/types";

export interface Viewer {
  userId: string;
  /** True for the household owner (head admin), who sees every figure. */
  isAdmin: boolean;
}

/** Whether the viewer may see an expense's total and everyone's shares. */
export function canSeeExpenseTotal(
  expense: Pick<Expense, "paidBy" | "createdBy">,
  viewer: Viewer,
): boolean {
  return (
    viewer.isAdmin ||
    expense.paidBy === viewer.userId ||
    expense.createdBy === viewer.userId
  );
}

/** Drop the total and other people's shares unless the viewer may see them. */
export function redactExpense(expense: Expense, viewer: Viewer): Expense {
  if (canSeeExpenseTotal(expense, viewer)) return expense;
  return {
    ...expense,
    amount: null,
    splits: expense.splits.filter((s) => s.userId === viewer.userId),
  };
}

export function redactExpenses(expenses: Expense[], viewer: Viewer): Expense[] {
  if (viewer.isAdmin) return expenses;
  return expenses.map((e) => redactExpense(e, viewer));
}

/** Keep every "A pays B" row, but only show the figure to the two parties. */
export function redactTransfers(
  transfers: SettlementTransfer[],
  viewer: Viewer,
): SettlementTransfer[] {
  if (viewer.isAdmin) return transfers;
  return transfers.map((t) =>
    t.from === viewer.userId || t.to === viewer.userId
      ? t
      : { ...t, amount: null },
  );
}

/** Same rule for recorded payments: the payer, the payee and the admin. */
export function redactSettlements(
  settlements: SettlementRecord[],
  viewer: Viewer,
): SettlementRecord[] {
  if (viewer.isAdmin) return settlements;
  return settlements.map((s) =>
    s.from === viewer.userId || s.to === viewer.userId
      ? s
      : { ...s, amount: null },
  );
}

/** Whether the viewer is a party to a transfer or payment (or the admin). */
export function canSettle(
  pair: { from: string; to: string },
  viewer: Viewer,
): boolean {
  return (
    viewer.isAdmin || pair.from === viewer.userId || pair.to === viewer.userId
  );
}

/** A recurring bill's amount is a household cost: admin only. */
export function redactRecurringBills(
  bills: RecurringBill[],
  viewer: Viewer,
): RecurringBill[] {
  if (viewer.isAdmin) return bills;
  return bills.map((b) => ({ ...b, amount: null }));
}

/** The pre-fill hint on a due variable bill is an amount too: admin only. */
export function redactPendingCharges(
  charges: PendingRecurringCharge[],
  viewer: Viewer,
): PendingRecurringCharge[] {
  if (viewer.isAdmin) return charges;
  return charges.map((c) => ({ ...c, estimatedAmount: null }));
}

/** The viewer's own share of an expense, or 0 when they're not in the split. */
export function ownShare(expense: Expense, viewer: Viewer): number {
  return expense.splits.find((s) => s.userId === viewer.userId)?.amount ?? 0;
}

// Activity details used to embed formatted money ("Added “Pizza” ($40.00)").
// New rows keep the amount in its own column instead, but rows written before
// that still carry it in the text, so strip anything that looks like money
// from a legacy detail before showing it to someone who may not see amounts.
const CURRENCY_SYMBOLS = Array.from(
  new Set(CURRENCIES.map((c) => c.symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))),
).join("|");
// A symbol (never mid-word, so "Room 2" survives the alphabetic ones like R or
// CHF) followed by digits, plus an optional "/mo"-style suffix.
const LEGACY_MONEY = new RegExp(
  `(?<![A-Za-z])(?:${CURRENCY_SYMBOLS})\\s?\\d[\\d.,]*(?:\\s?\\/\\s?\\w+)?`,
  "gu",
);

/** Best-effort removal of money that older activity rows baked into the text. */
export function stripLegacyMoney(detail: string | null): string | null {
  if (!detail) return detail;
  return detail
    .replace(LEGACY_MONEY, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([),.])/g, "$1")
    .trim();
}
