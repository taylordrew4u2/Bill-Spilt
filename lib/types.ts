// Shared domain types used across server and client.

export type SplitType = "equal" | "exact" | "percent";

export type ExpenseCategory =
  | "groceries"
  | "rent"
  | "utilities"
  | "dining"
  | "transport"
  | "entertainment"
  | "household"
  | "other";

export const CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: "groceries", label: "Groceries", emoji: "🛒" },
  { value: "rent", label: "Rent", emoji: "🏠" },
  { value: "utilities", label: "Utilities", emoji: "💡" },
  { value: "dining", label: "Dining", emoji: "🍽️" },
  { value: "transport", label: "Transport", emoji: "🚗" },
  { value: "entertainment", label: "Entertainment", emoji: "🎬" },
  { value: "household", label: "Household", emoji: "🧽" },
  { value: "other", label: "Other", emoji: "📦" },
];

export type RecurringFrequency = "weekly" | "monthly";

export interface Member {
  id: string;
  name: string;
  email: string;
}

export interface SplitInput {
  userId: string;
  /** For "exact": dollar amount. For "percent": 0-100. Ignored for "equal". */
  value?: number;
}

export interface ExpenseSplit {
  userId: string;
  name: string;
  amount: number;
}

export interface Expense {
  id: string;
  householdId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  splitType: SplitType;
  paidBy: string;
  paidByName: string;
  receiptUrl: string | null;
  createdAt: string;
  splits: ExpenseSplit[];
}

export interface Balance {
  userId: string;
  name: string;
  /** Positive = owed to them, negative = they owe. */
  net: number;
}

export interface SettlementTransfer {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export interface RecurringBill {
  id: string;
  householdId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  splitType: SplitType;
  paidBy: string;
  paidByName: string;
  frequency: RecurringFrequency;
  nextRun: string;
  active: boolean;
}

/** A queued offline expense awaiting sync (mirrors the create payload). */
export interface QueuedExpense {
  localId?: number;
  householdId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  splitType: SplitType;
  paidBy: string;
  splits: SplitInput[];
  createdAt: string;
  synced: 0 | 1;
}
