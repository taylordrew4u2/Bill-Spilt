import { sql, ensureSchema } from "@/lib/db";
import { stripLegacyMoney, type Viewer } from "@/lib/visibility";

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
  | "recurring_due"
  | "recurring_skipped"
  | "invite_regenerated";

export interface ActivityEntry {
  id: string;
  actorName: string;
  action: ActivityAction;
  detail: string | null;
  /** The money this entry involved, or `null` when there was none — or when
   *  the viewer isn't allowed to see it (see lib/visibility.ts). */
  amount: number | null;
  createdAt: string;
}

/**
 * Record a household activity. Best-effort: logging must never break the
 * action that triggered it. `actorId` may be null for system events (e.g. the
 * recurring-bills cron), in which case the actor shows as "System".
 *
 * Pass money as `amount` rather than formatting it into `detail`: it is stored
 * apart so the log can be rendered without figures for members who may not
 * see them.
 */
export async function logActivity(
  householdId: string,
  actorId: string | null,
  action: ActivityAction,
  detail?: string,
  amount?: number | null,
): Promise<void> {
  try {
    await sql`
      INSERT INTO activity_log (household_id, actor_id, actor_name, action, detail, amount)
      VALUES (
        ${householdId},
        ${actorId},
        COALESCE((SELECT name FROM users WHERE id = ${actorId}), 'System'),
        ${action},
        ${detail ?? null},
        ${amount ?? null}
      )
    `;
  } catch {
    /* activity logging is best-effort */
  }
}

/**
 * The household's recent activity. Amounts come back only for the admin and
 * for entries the viewer themselves caused; everyone else gets the same log
 * with the money left out.
 */
export async function getActivity(
  householdId: string,
  viewer: Viewer,
  limit = 50,
): Promise<ActivityEntry[]> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT id, actor_id, actor_name, action, detail, amount, created_at
    FROM activity_log
    WHERE household_id = ${householdId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => {
    const mine = r.actor_id !== null && r.actor_id === viewer.userId;
    const showMoney = viewer.isAdmin || mine;
    return {
      id: r.id,
      actorName: r.actor_name,
      action: r.action,
      detail: showMoney ? r.detail : stripLegacyMoney(r.detail),
      amount: showMoney && r.amount !== null ? Number(r.amount) : null,
      createdAt:
        r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    };
  });
}
