import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireHousehold, handle, ApiError } from "@/lib/api";
import { getSettlementPlan, getPairwiseBalance, findNonMembers } from "@/lib/queries";
import { getCachedPlan, setCachedPlan, invalidatePlan } from "@/lib/cache";
import { settleSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { formatCurrency } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The minimal settlement plan ("A pays B $X").
export async function GET() {
  return handle(async () => {
    const { householdId } = await requireHousehold();

    const cached = await getCachedPlan(householdId);
    if (cached) return NextResponse.json({ ...cached, cached: true });

    const plan = await getSettlementPlan(householdId);
    void setCachedPlan(householdId, plan);
    return NextResponse.json(plan);
  });
}

// Record that a transfer was paid; this rebalances the ledger.
export async function POST(req: Request) {
  return handle(async () => {
    const { userId, householdId, currency } = await requireHousehold();
    const body = await req.json();
    const parsed = settleSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors[0]?.message ?? "Invalid settlement");
    }

    const { from, to, amount } = parsed.data;
    if (from === to) throw new ApiError(400, "Payer and payee must differ");
    if ((await findNonMembers(householdId, [from, to])).length > 0) {
      throw new ApiError(403, "Both parties must be household members");
    }

    // A settlement can't exceed what the payer currently owes the payee, or it
    // would distort the ledger. `getPairwiseBalance(to, from) > 0` ⇒ from owes to.
    const owed = await getPairwiseBalance(householdId, to, from);
    if (amount > owed + 0.01) {
      throw new ApiError(400, "That's more than this person currently owes.");
    }

    await sql`
      INSERT INTO settlements (household_id, from_user, to_user, amount)
      VALUES (${householdId}, ${from}, ${to}, ${amount})
    `;
    void invalidatePlan(householdId);
    await logActivity(
      householdId,
      userId,
      "settlement_recorded",
      `Recorded a ${formatCurrency(amount, currency)} payment`,
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  });
}
