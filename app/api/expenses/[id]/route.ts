import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireHousehold, handle, ApiError } from "@/lib/api";
import { updateExpense } from "@/lib/expenses";
import { isMember } from "@/lib/queries";
import { expenseSchema } from "@/lib/validation";
import { invalidatePlan } from "@/lib/cache";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const { householdId } = await requireHousehold();

    // Only delete if the expense belongs to the caller's household.
    const { rowCount } = await sql`
      DELETE FROM expenses
      WHERE id = ${params.id} AND household_id = ${householdId}
    `;
    if (!rowCount) throw new ApiError(404, "Expense not found");

    void invalidatePlan(householdId);
    return NextResponse.json({ ok: true });
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const { householdId } = await requireHousehold();
    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors[0]?.message ?? "Invalid expense");
    }
    const data = parsed.data;

    const participants = new Set([data.paidBy, ...data.splits.map((s) => s.userId)]);
    for (const id of participants) {
      if (!(await isMember(householdId, id))) {
        throw new ApiError(403, "All participants must be household members");
      }
    }

    const ok = await updateExpense(params.id, {
      householdId,
      description: data.description,
      amount: data.amount,
      category: data.category,
      splitType: data.splitType,
      paidBy: data.paidBy,
      splits: data.splits,
      receiptUrl: data.receiptUrl ?? null,
    });
    if (!ok) throw new ApiError(404, "Expense not found");

    return NextResponse.json({ ok: true });
  });
}
