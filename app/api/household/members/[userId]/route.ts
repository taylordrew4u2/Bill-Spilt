import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireHousehold, handle, ApiError } from "@/lib/api";
import { isOwner, isMember, getBalances, getMembers } from "@/lib/queries";
import { invalidatePlan } from "@/lib/cache";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

/**
 * Remove a member from the household, or leave it yourself.
 *
 * - The head admin (owner) may remove any other member.
 * - Any member may remove themselves (i.e. leave).
 * - The owner cannot be removed (they'd have to delete the household).
 * - The member must be settled up (net balance ~0) first, so we never leave
 *   orphaned debt in the ledger.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  return handle(async () => {
    const { userId: targetId } = await params;
    const { userId: callerId, householdId } = await requireHousehold();

    if (!(await isMember(householdId, targetId))) {
      throw new ApiError(404, "That person isn't in this household");
    }
    const removingSelf = targetId === callerId;

    if (!removingSelf && !(await isOwner(householdId, callerId))) {
      throw new ApiError(403, "Only a household admin can remove members");
    }

    // An admin can only be removed by another admin (not themselves, to prevent lockout).
    if (!removingSelf && (await isOwner(householdId, targetId))) {
      // Ensure at least one admin remains after removal.
      const { rows } = await sql`
        SELECT COUNT(*)::int AS n FROM household_members
        WHERE household_id = ${householdId} AND role = 'owner'
      `;
      if (rows[0].n <= 1) {
        throw new ApiError(403, "Can't remove the last admin — promote someone else first");
      }
    }

    // Admins cannot leave while they are the last admin.
    if (removingSelf && (await isOwner(householdId, targetId))) {
      const { rows } = await sql`
        SELECT COUNT(*)::int AS n FROM household_members
        WHERE household_id = ${householdId} AND role = 'owner'
      `;
      if (rows[0].n <= 1) {
        throw new ApiError(403, "Promote another member to admin before leaving");
      }
    }

    // Must be settled up before leaving/removal.
    const balances = await getBalances(householdId);
    const bal = balances.find((b) => b.userId === targetId);
    if (bal && Math.abs(bal.net) >= 0.01) {
      throw new ApiError(
        400,
        removingSelf
          ? "Settle up your balance before leaving."
          : "This member must be settled up before you can remove them.",
      );
    }

    const targetName =
      (await getMembers(householdId)).find((m) => m.id === targetId)?.name ??
      "a member";

    await sql`
      DELETE FROM household_members
      WHERE household_id = ${householdId} AND user_id = ${targetId}
    `;
    void invalidatePlan(householdId);
    await logActivity(
      householdId,
      callerId,
      removingSelf ? "member_left" : "member_removed",
      removingSelf ? "Left the household" : `Removed ${targetName}`,
    );
    return NextResponse.json({ ok: true, left: removingSelf });
  });
}
