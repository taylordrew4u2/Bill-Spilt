import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireHousehold, handle, ApiError } from "@/lib/api";
import { getSettlementPlan, isOwner } from "@/lib/queries";
import { invalidatePlan } from "@/lib/cache";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

/**
 * Admin-only "settle everyone up". Computes the current minimal settlement
 * plan and records every transfer in one shot, clearing all balances. Only the
 * household owner (head admin) may do this.
 */
export async function POST() {
  return handle(async () => {
    const { userId, householdId } = await requireHousehold();

    if (!(await isOwner(householdId, userId))) {
      throw new ApiError(403, "Only the household admin can settle everyone up");
    }

    const { transfers } = await getSettlementPlan(householdId);
    if (transfers.length === 0) {
      return NextResponse.json({ recorded: 0 });
    }

    // Record each "A pays B $X" transfer as a settlement. We expand the plan
    // into a single multi-row insert via jsonb_to_recordset for atomicity.
    const rows = transfers.map((t) => ({
      from_user: t.from,
      to_user: t.to,
      amount: t.amount,
    }));

    await sql`
      INSERT INTO settlements (household_id, from_user, to_user, amount)
      SELECT ${householdId}, s.from_user, s.to_user, s.amount
      FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
        AS s(from_user uuid, to_user uuid, amount numeric)
    `;

    void invalidatePlan(householdId);
    await logActivity(
      householdId,
      userId,
      "settled_all",
      `Settled everyone up (${transfers.length} payment${transfers.length === 1 ? "" : "s"})`,
    );
    return NextResponse.json({ recorded: transfers.length });
  });
}
