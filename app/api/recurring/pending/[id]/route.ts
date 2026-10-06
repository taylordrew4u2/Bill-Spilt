import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireHousehold, handle, ApiError } from "@/lib/api";
import { createExpense } from "@/lib/expenses";
import { recurringChargeSchema } from "@/lib/validation";
import { validateSplits } from "@/lib/settlement";
import { invalidatePlan } from "@/lib/cache";
import { logActivity } from "@/lib/activity";
import { roundMoney } from "@/lib/utils";
import type { SplitInput } from "@/lib/types";

export const runtime = "nodejs";

/** Load a pending charge (with its bill) scoped to the caller's household. */
async function loadPending(id: string, householdId: string) {
  const { rows } = await sql`
    SELECT c.id, c.due_date,
           r.id AS recurring_id, r.description, r.category, r.split_type,
           r.paid_by, r.splits, r.frequency
    FROM recurring_charges c
    JOIN recurring_bills r ON r.id = c.recurring_id
    WHERE c.id = ${id} AND c.household_id = ${householdId} AND c.status = 'pending'
    LIMIT 1
  `;
  if (rows.length === 0) throw new ApiError(404, "No bill is waiting on that amount");
  return rows[0];
}

/**
 * Log a due variable bill with the amount it actually came to this cycle.
 * Creates the expense using the bill's saved split, then closes the charge.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const { userId, householdId } = await requireHousehold();

    const body = await req.json();
    const parsed = recurringChargeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors[0]?.message ?? "Invalid amount");
    }
    const amount = roundMoney(parsed.data.amount);

    const bill = await loadPending(id, householdId);
    const splits = (typeof bill.splits === "string"
      ? JSON.parse(bill.splits)
      : bill.splits) as SplitInput[];

    const err = validateSplits(amount, bill.split_type, splits);
    if (err) throw new ApiError(400, err);

    const expenseId = await createExpense({
      householdId,
      description: bill.description,
      amount,
      category: bill.category,
      splitType: bill.split_type,
      paidBy: bill.paid_by,
      createdBy: userId,
      splits,
      receiptUrl: parsed.data.receiptUrl ?? null,
      recurringId: bill.recurring_id,
    });

    // Only closes if it's still pending, so two people confirming at once
    // can't log the same cycle twice.
    const { rowCount } = await sql`
      UPDATE recurring_charges
      SET status = 'logged', expense_id = ${expenseId}
      WHERE id = ${id} AND household_id = ${householdId} AND status = 'pending'
    `;
    if (!rowCount) {
      await sql`DELETE FROM expenses WHERE id = ${expenseId}`;
      void invalidatePlan(householdId);
      throw new ApiError(409, "Someone just logged this bill");
    }

    await logActivity(
      householdId,
      userId,
      "recurring_charged",
      `Logged “${bill.description}”`,
      amount,
    );
    return NextResponse.json({ id: expenseId }, { status: 201 });
  });
}

/** Skip this cycle (e.g. a bill that didn't arrive) without logging anything. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const { userId, householdId } = await requireHousehold();

    const { rows } = await sql`
      UPDATE recurring_charges c
      SET status = 'skipped'
      FROM recurring_bills r
      WHERE c.id = ${id} AND c.household_id = ${householdId}
        AND c.status = 'pending' AND r.id = c.recurring_id
      RETURNING r.description
    `;
    if (rows.length === 0) {
      throw new ApiError(404, "No bill is waiting on that amount");
    }

    await logActivity(
      householdId,
      userId,
      "recurring_skipped",
      `Skipped this cycle of “${rows[0].description}”`,
    );
    return NextResponse.json({ ok: true });
  });
}
