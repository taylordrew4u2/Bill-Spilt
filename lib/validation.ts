import { z } from "zod";
import { CURRENCY_CODES } from "@/lib/types";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

/**
 * A receipt reference. Receipts are stored in Postgres and served from
 * `/api/receipts/<id>.<ext>`, kept relative so they survive a domain change.
 * Absolute URLs are still accepted: expenses created while receipts lived in
 * Vercel Blob hold one, and editing such an expense must not fail validation.
 */
const receiptPath = /^\/api\/receipts\/[0-9a-f-]{36}\.[a-z0-9]+$/i;
export const receiptUrlSchema = z
  .string()
  .refine(
    (v) => receiptPath.test(v) || z.string().url().safeParse(v).success,
    "Invalid receipt link",
  );

export const splitInputSchema = z.object({
  userId: z.string().uuid(),
  value: z.number().nonnegative().optional(),
});

export const expenseSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(140),
  amount: z.number().positive("Amount must be positive").max(1_000_000),
  category: z.enum([
    "groceries",
    "rent",
    "utilities",
    "dining",
    "transport",
    "entertainment",
    "household",
    "other",
  ]),
  splitType: z.enum(["equal", "exact", "percent"]),
  paidBy: z.string().uuid(),
  receiptUrl: receiptUrlSchema.nullable().optional(),
  splits: z.array(splitInputSchema).min(1, "Include at least one person"),
  // Optional client timestamp for offline-created expenses.
  createdAt: z.string().datetime().optional(),
});

export const recurringSchema = z
  .object({
    description: z.string().trim().min(1).max(140),
    /** "fixed" charges the same amount every cycle; "variable" asks for the
     *  real amount when the cycle comes due (electric, water, wifi…). */
    amountType: z.enum(["fixed", "variable"]).default("fixed"),
    /** Required for fixed bills; an optional typical amount for variable ones. */
    amount: z.number().nonnegative().max(1_000_000).optional(),
    category: expenseSchema.shape.category,
    splitType: expenseSchema.shape.splitType,
    paidBy: z.string().uuid(),
    frequency: z.enum(["weekly", "monthly"]),
    splits: z.array(splitInputSchema).min(1),
  })
  .superRefine((d, ctx) => {
    if (d.amountType === "fixed" && !(d.amount && d.amount > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "Amount must be positive",
      });
    }
    if (d.amountType === "variable" && d.splitType === "exact") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["splitType"],
        message:
          "A bill that changes each time can't use exact dollar splits — use equal or percent.",
      });
    }
  });

/** Payload for logging a due variable bill with its real amount. */
export const recurringChargeSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(1_000_000),
  receiptUrl: receiptUrlSchema.nullable().optional(),
});

export const settleSchema = z.object({
  from: z.string().uuid(),
  to: z.string().uuid(),
  amount: z.number().positive(),
});

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1, "Household name is required").max(80),
});

/** Household currency code (ISO 4217), restricted to the supported list. */
export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((c) => (CURRENCY_CODES as string[]).includes(c), "Unsupported currency");

export const updateHouseholdSchema = z.object({
  name: z.string().trim().min(1, "Household name is required").max(80).optional(),
  currency: currencySchema.optional(),
});

export const joinHouseholdSchema = z.object({
  code: z.string().trim().toUpperCase().min(4).max(12),
});

export const paymentMethodSchema = z.object({
  type: z.enum(["venmo", "cashapp", "paypal", "zelle", "applecash", "revolut"]),
  value: z.string().trim().min(1).max(200),
});

export const profileSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    paymentMethods: z.array(paymentMethodSchema).max(8).default([]),
    // Optional password change.
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(200)
      .optional(),
  })
  .refine((d) => !d.newPassword || !!d.currentPassword, {
    message: "Enter your current password to set a new one",
    path: ["currentPassword"],
  });

export const adSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  body: z.string().trim().max(280).optional().nullable(),
  imageUrl: z.string().trim().url("Enter a valid image URL").optional().nullable().or(z.literal("")),
  linkUrl: z.string().trim().url("Enter a valid link URL"),
  cta: z.string().trim().max(40).optional().nullable(),
  placement: z.enum(["all", "home", "expenses", "settle", "stats"]).default("all"),
  weight: z.number().int().min(1).max(100).default(1),
  active: z.boolean().default(true),
});

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export type AdInput = z.infer<typeof adSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type RecurringInput = z.infer<typeof recurringSchema>;
export type RecurringChargeInput = z.infer<typeof recurringChargeSchema>;
