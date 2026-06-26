import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireHousehold, handle, ApiError } from "@/lib/api";
import { isOwner } from "@/lib/queries";
import { generateInviteCode } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

/** Regenerate the household invite code. Admin-only. */
export async function POST() {
  return handle(async () => {
    const { userId, householdId } = await requireHousehold();

    if (!(await isOwner(householdId, userId))) {
      throw new ApiError(403, "Only an admin can regenerate the invite code");
    }

    let code = generateInviteCode();
    for (let i = 0; i < 5; i++) {
      const clash = await sql`SELECT 1 FROM households WHERE invite_code = ${code} LIMIT 1`;
      if (clash.rows.length === 0) break;
      code = generateInviteCode();
    }

    await sql`UPDATE households SET invite_code = ${code} WHERE id = ${householdId}`;
    await logActivity(householdId, userId, "invite_regenerated", "Regenerated the invite code");

    return NextResponse.json({ inviteCode: code });
  });
}
