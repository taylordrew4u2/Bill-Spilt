import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

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
  receiptUrl: z.string().url().nullable().optional(),
  splits: z.array(splitInputSchema).min(1, "Include at least one person"),
  // Optional client timestamp for offline-created expenses.
  createdAt: z.string().datetime().optional(),
});

export const recurringSchema = z.object({
  description: z.string().trim().min(1).max(140),
  amount: z.number().positive().max(1_000_000),
  category: expenseSchema.shape.category,
  splitType: expenseSchema.shape.splitType,
  paidBy: z.string().uuid(),
  frequency: z.enum(["weekly", "monthly"]),
  splits: z.array(splitInputSchema).min(1),
});

export const settleSchema = z.object({
  from: z.string().uuid(),
  to: z.string().uuid(),
  amount: z.number().positive(),
});

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1, "Household name is required").max(80),
});

export const joinHouseholdSchema = z.object({
  code: z.string().trim().toUpperCase().min(4).max(12),
});

export const paymentMethodSchema = z.object({
  type: z.enum(["venmo", "cashapp"]),
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

export type AdInput = z.infer<typeof adSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type RecurringInput = z.infer<typeof recurringSchema>;
