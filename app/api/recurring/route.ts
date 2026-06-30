import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireHousehold, handle, ApiError } from "@/lib/api";
import { getRecurringBills, isMember } from "@/lib/queries";
import { recurringSchema } from "@/lib/validation";
import { validateSplits } from "@/lib/settlement";
import { logActivity } from "@/lib/activity";
import { formatCurrency } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const { householdId } = await requireHousehold();
    const bills = await getRecurringBills(householdId);
    return NextResponse.json({ bills });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const { userId, householdId, currency } = await requireHousehold();
    const body = await req.json();
    const parsed = recurringSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors[0]?.message ?? "Invalid bill");
    }
    const data = parsed.data;

    const err = validateSplits(data.amount, data.splitType, data.splits);
    if (err) throw new ApiError(400, err);

    for (const id of [data.paidBy, ...data.splits.map((s) => s.userId)]) {
      if (!(await isMember(householdId, id))) {
        throw new ApiError(403, "All participants must be household members");
      }
    }

    // First run: tomorrow (so daily cron picks it up on its next pass).
    const next = new Date();
    next.setDate(next.getDate() + 1);
    const nextRun = next.toISOString().slice(0, 10);

    const { rows } = await sql`
      INSERT INTO recurring_bills
        (household_id, description, amount, category, split_type, paid_by, splits, frequency, next_run)
      VALUES (
        ${householdId}, ${data.description}, ${data.amount}, ${data.category},
        ${data.splitType}, ${data.paidBy}, ${JSON.stringify(data.splits)}::jsonb,
        ${data.frequency}, ${nextRun}
      )
      RETURNING id
    `;
    await logActivity(
      householdId,
      userId,
      "recurring_added",
      `Added recurring bill “${data.description}” (${formatCurrency(data.amount, currency)}/${data.frequency === "weekly" ? "wk" : "mo"})`,
    );
    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  });
}

export async function DELETE(req: Request) {
  return handle(async () => {
    const { householdId } = await requireHousehold();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) throw new ApiError(400, "Missing bill id");
    const { rowCount } = await sql`
      DELETE FROM recurring_bills WHERE id = ${id} AND household_id = ${householdId}
    `;
    if (!rowCount) throw new ApiError(404, "Recurring bill not found");
    return NextResponse.json({ ok: true });
  });
}
