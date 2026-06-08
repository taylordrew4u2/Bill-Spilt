import { NextResponse } from "next/server";
import { sql, ensureSchema, MAX_MEMBERS } from "@/lib/db";
import { requireUserId, requireHousehold, handle, ApiError } from "@/lib/api";
import { getUserHousehold, isOwner } from "@/lib/queries";
import { createHouseholdSchema, joinHouseholdSchema } from "@/lib/validation";
import { generateInviteCode } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

// Return the current user's household (or null).
export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const household = await getUserHousehold(userId);
    return NextResponse.json({ household });
  });
}

// Rename the household (head admin only).
export async function PATCH(req: Request) {
  return handle(async () => {
    const { userId, householdId } = await requireHousehold();
    if (!(await isOwner(householdId, userId))) {
      throw new ApiError(403, "Only the household admin can rename the household");
    }
    const body = await req.json();
    const parsed = createHouseholdSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Household name is required");

    await sql`
      UPDATE households SET name = ${parsed.data.name} WHERE id = ${householdId}
    `;
    await logActivity(
      householdId,
      userId,
      "household_renamed",
      `Renamed the household to “${parsed.data.name}”`,
    );
    return NextResponse.json({ ok: true, name: parsed.data.name });
  });
}

// Create a new household, or join one via invite code (action discriminator).
export async function POST(req: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    await ensureSchema();
    const body = await req.json();

    if (body.action === "join") {
      const parsed = joinHouseholdSchema.safeParse(body);
      if (!parsed.success) throw new ApiError(400, "Enter a valid invite code");
      const { code } = parsed.data;

      const { rows } = await sql`
        SELECT id, name FROM households WHERE invite_code = ${code} LIMIT 1
      `;
      const household = rows[0];
      if (!household) throw new ApiError(404, "No household found for that code");

      const count = await sql`
        SELECT COUNT(*)::int AS n FROM household_members WHERE household_id = ${household.id}
      `;
      if (count.rows[0].n >= MAX_MEMBERS) {
        throw new ApiError(403, `This household is full (max ${MAX_MEMBERS} members)`);
      }

      await sql`
        INSERT INTO household_members (household_id, user_id)
        VALUES (${household.id}, ${userId})
        ON CONFLICT DO NOTHING
      `;
      await logActivity(household.id, userId, "member_joined", "Joined the household");
      return NextResponse.json({ household }, { status: 200 });
    }

    // default: create
    const parsed = createHouseholdSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Household name is required");

    // Generate a unique invite code (retry on the rare collision).
    let code = generateInviteCode();
    for (let i = 0; i < 5; i++) {
      const clash = await sql`SELECT 1 FROM households WHERE invite_code = ${code} LIMIT 1`;
      if (clash.rows.length === 0) break;
      code = generateInviteCode();
    }

    const { rows } = await sql`
      INSERT INTO households (name, invite_code, created_by)
      VALUES (${parsed.data.name}, ${code}, ${userId})
      RETURNING id, name, invite_code
    `;
    const household = rows[0];
    await sql`
      INSERT INTO household_members (household_id, user_id, role)
      VALUES (${household.id}, ${userId}, 'owner')
    `;
    return NextResponse.json(
      {
        household: {
          id: household.id,
          name: household.name,
          inviteCode: household.invite_code,
        },
      },
      { status: 201 },
    );
  });
}
