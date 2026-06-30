import { sql, ensureSchema, MAX_MEMBERS } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export interface InviteHousehold {
  id: string;
  name: string;
}

/** Look up a household by its (case-insensitive) invite code. */
export async function getHouseholdByCode(
  rawCode: string,
): Promise<InviteHousehold | null> {
  const code = rawCode.trim().toUpperCase();
  if (code.length < 4 || code.length > 12) return null;
  await ensureSchema();
  const { rows } = await sql`
    SELECT id, name FROM households WHERE invite_code = ${code} LIMIT 1
  `;
  return rows[0] ? { id: rows[0].id, name: rows[0].name } : null;
}

export type JoinResult =
  | { ok: true; household: InviteHousehold; alreadyMember: boolean }
  | { ok: false; status: number; error: string };

/**
 * Add a user to the household identified by an invite code. Shared by the
 * invite link (`/join/[code]`) and the household API so both behave
 * identically. Idempotent: re-joining a household you're already in succeeds.
 */
export async function joinHouseholdByCode(
  userId: string,
  rawCode: string,
): Promise<JoinResult> {
  const household = await getHouseholdByCode(rawCode);
  if (!household) {
    return { ok: false, status: 404, error: "No household found for that code" };
  }

  const member = await sql`
    SELECT 1 FROM household_members
    WHERE household_id = ${household.id} AND user_id = ${userId} LIMIT 1
  `;
  if (member.rows.length > 0) {
    return { ok: true, household, alreadyMember: true };
  }

  const count = await sql`
    SELECT COUNT(*)::int AS n FROM household_members WHERE household_id = ${household.id}
  `;
  if (count.rows[0].n >= MAX_MEMBERS) {
    return {
      ok: false,
      status: 403,
      error: `This household is full (max ${MAX_MEMBERS} members)`,
    };
  }

  await sql`
    INSERT INTO household_members (household_id, user_id)
    VALUES (${household.id}, ${userId})
    ON CONFLICT DO NOTHING
  `;
  await logActivity(household.id, userId, "member_joined", "Joined the household");
  return { ok: true, household, alreadyMember: false };
}
