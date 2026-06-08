import { db } from "@vercel/postgres";
import { ensureSchema } from "@/lib/db";
import { computeSplits, validateSplits } from "@/lib/settlement";
import { invalidatePlan } from "@/lib/cache";
import type { SplitInput, SplitType, ExpenseCategory } from "@/lib/types";

export interface CreateExpenseArgs {
  householdId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  splitType: SplitType;
  paidBy: string;
  splits: SplitInput[];
  receiptUrl?: string | null;
  recurringId?: string | null;
  createdAt?: string;
}

/**
 * Insert an expense and its per-member splits atomically. Validates that the
 * split amounts reconcile to the total before writing. Returns the new id.
 */
export async function createExpense(args: CreateExpenseArgs): Promise<string> {
  const err = validateSplits(args.amount, args.splitType, args.splits);
  if (err) throw new Error(err);

  const shares = computeSplits(args.amount, args.splitType, args.splits);

  await ensureSchema();
  const client = await db.connect();
  try {
    await client.sql`BEGIN`;
    const { rows } = await client.sql`
      INSERT INTO expenses
        (household_id, description, amount, category, split_type, paid_by, receipt_url, recurring_id, created_at)
      VALUES (
        ${args.householdId}, ${args.description}, ${args.amount}, ${args.category},
        ${args.splitType}, ${args.paidBy}, ${args.receiptUrl ?? null},
        ${args.recurringId ?? null}, ${args.createdAt ?? new Date().toISOString()}
      )
      RETURNING id
    `;
    const expenseId = rows[0].id as string;

    for (const [userId, amount] of Object.entries(shares)) {
      await client.sql`
        INSERT INTO expense_splits (expense_id, user_id, amount)
        VALUES (${expenseId}, ${userId}, ${amount})
      `;
    }
    await client.sql`COMMIT`;
    void invalidatePlan(args.householdId);
    return expenseId;
  } catch (e) {
    await client.sql`ROLLBACK`;
    throw e;
  } finally {
    client.release();
  }
}
