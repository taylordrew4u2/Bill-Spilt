import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { requireSiteAdmin, handle } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-time maintenance action: delete the throwaway test accounts created
 * during development. Gated behind the site-admin (operator) session, so it is
 * NOT publicly reachable. Scoped strictly to @example.com addresses, so it can
 * never affect real accounts. Removed after use.
 */
export async function POST() {
  return handle(async () => {
    await requireSiteAdmin();
    await ensureSchema();

    // Cascades remove each user's expenses, splits, settlements, memberships.
    const users = await sql`
      DELETE FROM users WHERE email LIKE '%@example.com' RETURNING email
    `;
    // Drop households left with no members (test-only households).
    const households = await sql`
      DELETE FROM households
      WHERE id NOT IN (SELECT DISTINCT household_id FROM household_members)
      RETURNING name
    `;

    return NextResponse.json({
      deletedUsers: users.rowCount,
      deletedHouseholds: households.rowCount,
    });
  });
}
