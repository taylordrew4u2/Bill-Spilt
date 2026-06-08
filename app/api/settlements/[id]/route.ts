import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireHousehold, handle, ApiError } from "@/lib/api";
import { invalidatePlan } from "@/lib/cache";

export const runtime = "nodejs";

// Undo a recorded settlement (re-opens the corresponding balance).
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const { householdId } = await requireHousehold();
    const { rowCount } = await sql`
      DELETE FROM settlements
      WHERE id = ${params.id} AND household_id = ${householdId}
    `;
    if (!rowCount) throw new ApiError(404, "Settlement not found");
    void invalidatePlan(householdId);
    return NextResponse.json({ ok: true });
  });
}
