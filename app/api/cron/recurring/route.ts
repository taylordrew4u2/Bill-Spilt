import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { createExpense } from "@/lib/expenses";
import { logActivity } from "@/lib/activity";
import { pruneOrphanReceipts } from "@/lib/receipts";
import type { SplitInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily Vercel Cron entry point (see vercel.json). Materialises every
 * recurring bill whose `next_run` is due, then advances its schedule.
 *
 * Fixed-amount bills become an expense immediately. Variable-amount bills
 * (electric, water, wifi…) instead raise a pending charge in
 * `recurring_charges`, which the household resolves by entering the real
 * amount from the Stats screen.
 *
 * Protected by CRON_SECRET: Vercel Cron sends it as `Authorization: Bearer …`.
 */
export async function GET(req: Request) {
  // Fail closed: without a configured secret this endpoint would be public and
  // anyone could trigger materialisation of every due recurring bill.
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSchema();
  const today = new Date().toISOString().slice(0, 10);

  const { rows: due } = await sql`
    SELECT rb.*, h.currency AS household_currency
    FROM recurring_bills rb
    JOIN households h ON h.id = rb.household_id
    WHERE rb.active = true AND rb.next_run <= ${today}
  `;

  let processed = 0;
  let awaitingAmount = 0;
  for (const bill of due) {
    try {
      // Drivers hand `next_run` back as a Date or a string; normalise to
      // YYYY-MM-DD so both the charge row and the next schedule agree.
      const dueDate =
        bill.next_run instanceof Date
          ? bill.next_run.toISOString().slice(0, 10)
          : String(bill.next_run);

      if (bill.amount_type === "variable") {
        // The amount changes every cycle (electric, water, wifi…), so raise a
        // charge for someone to fill in rather than guessing a number.
        await sql`
          INSERT INTO recurring_charges (household_id, recurring_id, due_date)
          VALUES (${bill.household_id}, ${bill.id}, ${dueDate})
          ON CONFLICT (recurring_id, due_date) DO NOTHING
        `;
        await logActivity(
          bill.household_id,
          null,
          "recurring_due",
          `“${bill.description}” is due — add this cycle's amount`,
        );
        awaitingAmount++;
      } else {
        const splits = (bill.splits as SplitInput[]) ?? [];
        await createExpense({
          householdId: bill.household_id,
          description: bill.description,
          amount: Number(bill.amount),
          category: bill.category,
          splitType: bill.split_type,
          paidBy: bill.paid_by,
          splits,
          recurringId: bill.id,
        });

        await logActivity(
          bill.household_id,
          null,
          "recurring_charged",
          `Auto-logged recurring bill “${bill.description}”`,
          Number(bill.amount),
        );
      }

      // Advance the schedule from the previous next_run to avoid drift.
      const base = new Date(dueDate);
      if (bill.frequency === "weekly") base.setDate(base.getDate() + 7);
      else base.setMonth(base.getMonth() + 1);
      const nextRun = base.toISOString().slice(0, 10);

      await sql`UPDATE recurring_bills SET next_run = ${nextRun} WHERE id = ${bill.id}`;
      processed++;
    } catch (e) {
      console.error(`[cron] failed to process recurring bill ${bill.id}:`, e);
    }
  }

  // Receipt bytes share the database's free-tier quota, so the daily run also
  // clears uploads no expense ever ended up pointing at.
  let prunedReceipts = 0;
  try {
    prunedReceipts = await pruneOrphanReceipts();
  } catch (e) {
    console.error("[cron] failed to prune orphaned receipts:", e);
  }

  return NextResponse.json({
    processed,
    awaitingAmount,
    total: due.length,
    prunedReceipts,
    date: today,
  });
}
