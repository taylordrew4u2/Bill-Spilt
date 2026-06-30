// Shared domain types used across server and client.

import {
  ShoppingCart,
  Home,
  Zap,
  Utensils,
  Car,
  Film,
  Sparkles,
  Package,
  type LucideIcon,
} from "lucide-react";

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

export const CATEGORIES: {
  value: ExpenseCategory;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "groceries", label: "Groceries", icon: ShoppingCart },
  { value: "rent", label: "Rent", icon: Home },
  { value: "utilities", label: "Utilities", icon: Zap },
  { value: "dining", label: "Dining", icon: Utensils },
  { value: "transport", label: "Transport", icon: Car },
  { value: "entertainment", label: "Entertainment", icon: Film },
  { value: "household", label: "Household", icon: Sparkles },
  { value: "other", label: "Other", icon: Package },
];

export type RecurringFrequency = "weekly" | "monthly";

export type PaymentMethodType =
  | "venmo"
  | "cashapp"
  | "paypal"
  | "zelle"
  | "applecash"
  | "revolut";

export const PAYMENT_METHODS: {
  value: PaymentMethodType;
  label: string;
  placeholder: string;
}[] = [
  { value: "venmo", label: "Venmo", placeholder: "@username" },
  { value: "cashapp", label: "Cash App", placeholder: "$cashtag" },
  { value: "paypal", label: "PayPal", placeholder: "paypal.me/you or email" },
  { value: "zelle", label: "Zelle", placeholder: "email or phone" },
  { value: "applecash", label: "Apple Cash", placeholder: "phone or email" },
  { value: "revolut", label: "Revolut", placeholder: "@revtag" },
];

export interface PaymentMethod {
  type: PaymentMethodType;
  value: string;
}

/** Supported display currencies. Amounts aren't converted — this only changes
 *  how money is formatted (symbol, grouping, decimals). */
export const CURRENCIES: { code: string; label: string; symbol: string }[] = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "NZD", label: "New Zealand Dollar", symbol: "NZ$" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "CNY", label: "Chinese Yuan", symbol: "¥" },
  { code: "MXN", label: "Mexican Peso", symbol: "MX$" },
  { code: "BRL", label: "Brazilian Real", symbol: "R$" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$" },
  { code: "CHF", label: "Swiss Franc", symbol: "CHF" },
  { code: "SEK", label: "Swedish Krona", symbol: "kr" },
  { code: "ZAR", label: "South African Rand", symbol: "R" },
];

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code);
export const DEFAULT_CURRENCY = "USD";

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
