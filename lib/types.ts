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

export type PaymentMethodType = "venmo" | "cashapp";

export const PAYMENT_METHODS: {
  value: PaymentMethodType;
  label: string;
  emoji: string;
  placeholder: string;
}[] = [
  { value: "venmo", label: "Venmo", emoji: "💸", placeholder: "@username" },
  { value: "cashapp", label: "Cash App", emoji: "💵", placeholder: "$cashtag" },
];

export interface PaymentMethod {
  type: PaymentMethodType;
  value: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";
  paymentMethods: PaymentMethod[];
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
  createdBy: string | null;
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

export type AdPlacement = "all" | "home" | "expenses" | "settle" | "stats";

export const AD_PLACEMENTS: { value: AdPlacement; label: string }[] = [
  { value: "all", label: "Everywhere" },
  { value: "home", label: "Home" },
  { value: "expenses", label: "Expenses" },
  { value: "settle", label: "Settle" },
  { value: "stats", label: "Stats" },
];

export interface Ad {
  id: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string;
  cta: string | null;
  placement: AdPlacement;
  weight: number;
  active: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
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
