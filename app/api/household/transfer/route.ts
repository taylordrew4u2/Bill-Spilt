import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireHousehold, handle, ApiError } from "@/lib/api";
import { isOwner, isMember } from "@/lib/queries";
import { z } from "zod";

export const runtime = "nodejs";

const transferSchema = z.object({ toUserId: z.string().uuid() });

/**
 * Transfer the head-admin (owner) role to another member. Only the current
 * owner may do this. Demotes the current owner to member and promotes the
 * target — atomically in a single statement.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const { userId, householdId } = await requireHousehold();

    if (!(await isOwner(householdId, userId))) {
      throw new ApiError(403, "Only the current admin can transfer admin");
    }

    const parsed = transferSchema.safeParse(await req.json());
    if (!parsed.success) throw new ApiError(400, "Pick a member to make admin");
    const { toUserId } = parsed.data;

    if (toUserId === userId) {
      throw new ApiError(400, "You're already the admin");
    }
    if (!(await isMember(householdId, toUserId))) {
      throw new ApiError(404, "That person isn't in this household");
    }

    await sql`
      UPDATE household_members
      SET role = CASE
        WHEN user_id = ${userId}   THEN 'member'
        WHEN user_id = ${toUserId} THEN 'owner'
        ELSE role
      END
      WHERE household_id = ${householdId}
        AND user_id IN (${userId}, ${toUserId})
    `;

    return NextResponse.json({ ok: true });
  });
}
