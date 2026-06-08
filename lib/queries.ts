import { sql, ensureSchema } from "@/lib/db";
import { computeBalances, minimizeTransfers } from "@/lib/settlement";
import type {
  Balance,
  Expense,
  ExpenseSplit,
  Member,
  RecurringBill,
  SettlementTransfer,
} from "@/lib/types";

/**
 * Return the household the user belongs to (the app assumes one active
 * household per user for simplicity — the first they joined). Returns null
 * if the user has no household yet.
 */
export async function getUserHousehold(
  userId: string,
): Promise<{ id: string; name: string; inviteCode: string } | null> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT h.id, h.name, h.invite_code
    FROM households h
    JOIN household_members m ON m.household_id = h.id
    WHERE m.user_id = ${userId}
    ORDER BY m.joined_at ASC
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return { id: rows[0].id, name: rows[0].name, inviteCode: rows[0].invite_code };
}

/** Verify a user is a member of a household (authorisation guard). */
export async function isMember(
  householdId: string,
  userId: string,
): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT 1 FROM household_members
    WHERE household_id = ${householdId} AND user_id = ${userId}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function getMembers(householdId: string): Promise<Member[]> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT u.id, u.name, u.email
    FROM household_members m
    JOIN users u ON u.id = m.user_id
    WHERE m.household_id = ${householdId}
    ORDER BY m.joined_at ASC
  `;
  return rows.map((r) => ({ id: r.id, name: r.name, email: r.email }));
}

export async function getExpenses(householdId: string): Promise<Expense[]> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT
      e.id, e.household_id, e.description, e.amount, e.category,
      e.split_type, e.paid_by, e.receipt_url, e.created_at,
      payer.name AS paid_by_name
    FROM expenses e
    JOIN users payer ON payer.id = e.paid_by
    WHERE e.household_id = ${householdId}
    ORDER BY e.created_at DESC
  `;
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const { rows: splitRows } = await sql.query(
    `SELECT s.expense_id, s.user_id, s.amount, u.name
     FROM expense_splits s JOIN users u ON u.id = s.user_id
     WHERE s.expense_id = ANY($1::uuid[])`,
    [ids],
  );

  const splitsByExpense = new Map<string, ExpenseSplit[]>();
  for (const s of splitRows) {
    const arr = splitsByExpense.get(s.expense_id) ?? [];
    arr.push({ userId: s.user_id, name: s.name, amount: Number(s.amount) });
    splitsByExpense.set(s.expense_id, arr);
  }

  return rows.map((r) => ({
    id: r.id,
    householdId: r.household_id,
    description: r.description,
    amount: Number(r.amount),
    category: r.category,
    splitType: r.split_type,
    paidBy: r.paid_by,
    paidByName: r.paid_by_name,
    receiptUrl: r.receipt_url,
    createdAt:
      r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    splits: splitsByExpense.get(r.id) ?? [],
  }));
}

/**
 * Compute net balances for the household. Net = (total a member paid) -
 * (total of their shares) - (settlements they received) + (settlements they
 * sent). Settling reduces what one party is owed and what the other owes.
 */
export async function getBalances(householdId: string): Promise<Balance[]> {
  await ensureSchema();
  const members = await getMembers(householdId);

  const { rows: paidRows } = await sql`
    SELECT paid_by AS user_id, COALESCE(SUM(amount), 0) AS total
    FROM expenses WHERE household_id = ${householdId}
    GROUP BY paid_by
  `;
  const { rows: owedRows } = await sql`
    SELECT s.user_id, COALESCE(SUM(s.amount), 0) AS total
    FROM expense_splits s
    JOIN expenses e ON e.id = s.expense_id
    WHERE e.household_id = ${householdId}
    GROUP BY s.user_id
  `;
  const { rows: settleRows } = await sql`
    SELECT from_user, to_user, amount FROM settlements
    WHERE household_id = ${householdId}
  `;

  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};
  for (const r of paidRows) paid[r.user_id] = Number(r.total);
  for (const r of owedRows) owed[r.user_id] = Number(r.total);

  // A settlement: `from` pays `to`. That increases `from`'s effective paid
  // and increases `to`'s effective owed, moving both toward zero.
  for (const s of settleRows) {
    paid[s.from_user] = (paid[s.from_user] ?? 0) + Number(s.amount);
    owed[s.to_user] = (owed[s.to_user] ?? 0) + Number(s.amount);
  }

  return computeBalances(members, paid, owed);
}

export async function getSettlementPlan(
  householdId: string,
): Promise<{ balances: Balance[]; transfers: SettlementTransfer[] }> {
  const balances = await getBalances(householdId);
  const transfers = minimizeTransfers(balances);
  return { balances, transfers };
}

export async function getRecurringBills(
  householdId: string,
): Promise<RecurringBill[]> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT r.*, u.name AS paid_by_name
    FROM recurring_bills r
    JOIN users u ON u.id = r.paid_by
    WHERE r.household_id = ${householdId}
    ORDER BY r.next_run ASC
  `;
  return rows.map((r) => ({
    id: r.id,
    householdId: r.household_id,
    description: r.description,
    amount: Number(r.amount),
    category: r.category,
    splitType: r.split_type,
    paidBy: r.paid_by,
    paidByName: r.paid_by_name,
    frequency: r.frequency,
    nextRun:
      r.next_run instanceof Date
        ? r.next_run.toISOString().slice(0, 10)
        : String(r.next_run),
    active: r.active,
  }));
}
