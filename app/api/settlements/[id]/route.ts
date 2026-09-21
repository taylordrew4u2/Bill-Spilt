import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireViewer, handle, ApiError } from "@/lib/api";
import { invalidatePlan } from "@/lib/cache";
import { logActivity } from "@/lib/activity";
import { canSettle } from "@/lib/visibility";

export const runtime = "nodejs";

// Undo a recorded settlement (re-opens the corresponding balance).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const { userId, householdId, viewer } = await requireViewer();

    // Undoing re-opens a balance between two people: theirs to undo, or the
    // admin's. It's also the pair whose figure they're allowed to see.
    const { rows } = await sql`
      SELECT from_user, to_user FROM settlements
      WHERE id = ${id} AND household_id = ${householdId}
      LIMIT 1
    `;
    if (rows.length === 0) throw new ApiError(404, "Settlement not found");
    if (!canSettle({ from: rows[0].from_user, to: rows[0].to_user }, viewer)) {
      throw new ApiError(403, "Only the people involved can undo this payment");
    }

    await sql`
      DELETE FROM settlements
      WHERE id = ${id} AND household_id = ${householdId}
    `;
    void invalidatePlan(householdId);
    await logActivity(householdId, userId, "settlement_undone", "Undid a settlement");
    return NextResponse.json({ ok: true });
  });
}
