import { sql, ensureSchema } from "@/lib/db";
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
  createdBy?: string | null;
  splits: SplitInput[];
  receiptUrl?: string | null;
  recurringId?: string | null;
  createdAt?: string;
}

/**
 * Insert an expense and its per-member splits atomically. Validates that the
 * split amounts reconcile to the total before writing. Returns the new id.
 *
 * Because the Neon HTTP driver runs one statement per request (no interactive
 * BEGIN/COMMIT), we do the whole write as a single atomic statement: a CTE
 * inserts the expense, and a second data-modifying CTE inserts every split by
 * expanding a JSON array with `jsonb_to_recordset`. Postgres runs both
 * data-modifying CTEs to completion within the one implicit transaction.
 */
export async function createExpense(args: CreateExpenseArgs): Promise<string> {
  const err = validateSplits(args.amount, args.splitType, args.splits);
  if (err) throw new Error(err);

  const shares = computeSplits(args.amount, args.splitType, args.splits);
  const splitRows = Object.entries(shares).map(([user_id, amount]) => ({
    user_id,
    amount,
  }));

  await ensureSchema();
  const { rows } = await sql`
    WITH new_expense AS (
      INSERT INTO expenses
        (household_id, description, amount, category, split_type, paid_by, created_by, receipt_url, recurring_id, created_at)
      VALUES (
        ${args.householdId}, ${args.description}, ${args.amount}, ${args.category},
        ${args.splitType}, ${args.paidBy}, ${args.createdBy ?? null}, ${args.receiptUrl ?? null},
        ${args.recurringId ?? null}, ${args.createdAt ?? new Date().toISOString()}
      )
      RETURNING id
    ),
    inserted_splits AS (
      INSERT INTO expense_splits (expense_id, user_id, amount)
      SELECT new_expense.id, s.user_id, s.amount
      FROM new_expense
      CROSS JOIN jsonb_to_recordset(${JSON.stringify(splitRows)}::jsonb)
        AS s(user_id uuid, amount numeric)
      RETURNING 1
    )
    SELECT id FROM new_expense
  `;

  const expenseId = rows[0].id as string;
  void invalidatePlan(args.householdId);
  return expenseId;
}

/**
 * Update an existing expense (scoped to its household) and replace its splits,
 * atomically in a single statement: a CTE updates the row, deletes the old
 * splits, and inserts the recomputed ones. Returns false if no such expense
 * exists in the household.
 */
export async function updateExpense(
  expenseId: string,
  args: Omit<CreateExpenseArgs, "createdAt" | "recurringId">,
): Promise<boolean> {
  const err = validateSplits(args.amount, args.splitType, args.splits);
  if (err) throw new Error(err);

  const shares = computeSplits(args.amount, args.splitType, args.splits);
  const splitRows = Object.entries(shares).map(([user_id, amount]) => ({
    user_id,
    amount,
  }));

  await ensureSchema();
  const { rows } = await sql`
    WITH upd AS (
      UPDATE expenses SET
        description = ${args.description},
        amount      = ${args.amount},
        category    = ${args.category},
        split_type  = ${args.splitType},
        paid_by     = ${args.paidBy},
        receipt_url = ${args.receiptUrl ?? null}
      WHERE id = ${expenseId} AND household_id = ${args.householdId}
      RETURNING id
    ),
    del AS (
      DELETE FROM expense_splits
      WHERE expense_id IN (SELECT id FROM upd)
      RETURNING 1
    ),
    ins AS (
      INSERT INTO expense_splits (expense_id, user_id, amount)
      SELECT (SELECT id FROM upd), s.user_id, s.amount
      FROM jsonb_to_recordset(${JSON.stringify(splitRows)}::jsonb)
        AS s(user_id uuid, amount numeric)
      WHERE EXISTS (SELECT 1 FROM upd)
      RETURNING 1
    )
    SELECT id FROM upd
  `;

  if (rows.length === 0) return false;
  void invalidatePlan(args.householdId);
  return true;
}
