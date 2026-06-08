import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { createExpense } from "@/lib/expenses";
import type { SplitInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily Vercel Cron entry point (see vercel.json). Materialises every
 * recurring bill whose `next_run` is due, then advances its schedule.
 *
 * Protected by CRON_SECRET: Vercel Cron sends it as `Authorization: Bearer …`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  await ensureSchema();
  const today = new Date().toISOString().slice(0, 10);

  const { rows: due } = await sql`
    SELECT * FROM recurring_bills
    WHERE active = true AND next_run <= ${today}
  `;

  let processed = 0;
  for (const bill of due) {
    try {
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

      // Advance the schedule from the previous next_run to avoid drift.
      const base = new Date(bill.next_run);
      if (bill.frequency === "weekly") base.setDate(base.getDate() + 7);
      else base.setMonth(base.getMonth() + 1);
      const nextRun = base.toISOString().slice(0, 10);

      await sql`UPDATE recurring_bills SET next_run = ${nextRun} WHERE id = ${bill.id}`;
      processed++;
    } catch (e) {
      console.error(`[cron] failed to process recurring bill ${bill.id}:`, e);
    }
  }

  return NextResponse.json({ processed, total: due.length, date: today });
}
