import { sql, ensureSchema } from "@/lib/db";

export type ActivityAction =
  | "expense_added"
  | "expense_edited"
  | "expense_deleted"
  | "settlement_recorded"
  | "settlement_undone"
  | "settled_all"
  | "member_joined"
  | "member_removed"
  | "member_left"
  | "household_renamed"
  | "currency_changed"
  | "admin_transferred"
  | "recurring_added"
  | "recurring_charged"
  | "invite_regenerated";

export interface ActivityEntry {
  id: string;
  actorName: string;
  action: ActivityAction;
  detail: string | null;
  createdAt: string;
}

/**
 * Record a household activity. Best-effort: logging must never break the
 * action that triggered it. `actorId` may be null for system events (e.g. the
 * recurring-bills cron), in which case the actor shows as "System".
 */
export async function logActivity(
  householdId: string,
  actorId: string | null,
  action: ActivityAction,
  detail?: string,
): Promise<void> {
  try {
    await sql`
      INSERT INTO activity_log (household_id, actor_id, actor_name, action, detail)
      VALUES (
        ${householdId},
        ${actorId},
        COALESCE((SELECT name FROM users WHERE id = ${actorId}), 'System'),
        ${action},
        ${detail ?? null}
      )
    `;
  } catch {
    /* activity logging is best-effort */
  }
}

export async function getActivity(
  householdId: string,
  limit = 50,
): Promise<ActivityEntry[]> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT id, actor_name, action, detail, created_at
    FROM activity_log
    WHERE household_id = ${householdId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id: r.id,
    actorName: r.actor_name,
    action: r.action,
    detail: r.detail,
    createdAt:
      r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }));
}
