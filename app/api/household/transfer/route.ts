import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireHousehold, handle, ApiError } from "@/lib/api";
import { isOwner, isMember, getMembers } from "@/lib/queries";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

export const runtime = "nodejs";

const transferSchema = z.object({ toUserId: z.string().uuid() });

/**
 * Promote a member to admin (owner). Any existing admin may do this.
 * Multiple admins are allowed — the caller keeps their own admin role.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const { userId, householdId } = await requireHousehold();

    if (!(await isOwner(householdId, userId))) {
      throw new ApiError(403, "Only an admin can promote members");
    }

    const parsed = transferSchema.safeParse(await req.json());
    if (!parsed.success) throw new ApiError(400, "Pick a member to make admin");
    const { toUserId } = parsed.data;

    if (toUserId === userId) {
      throw new ApiError(400, "You're already an admin");
    }
    if (!(await isMember(householdId, toUserId))) {
      throw new ApiError(404, "That person isn't in this household");
    }
    if (await isOwner(householdId, toUserId)) {
      throw new ApiError(400, "That person is already an admin");
    }

    await sql`
      UPDATE household_members
      SET role = 'owner'
      WHERE household_id = ${householdId} AND user_id = ${toUserId}
    `;

    const newAdmin =
      (await getMembers(householdId)).find((m) => m.id === toUserId)?.name ??
      "a member";
    await logActivity(
      householdId,
      userId,
      "admin_transferred",
      `Made ${newAdmin} an admin`,
    );
    return NextResponse.json({ ok: true });
  });
}
