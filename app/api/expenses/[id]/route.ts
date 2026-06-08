import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireHousehold, handle, ApiError } from "@/lib/api";
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
