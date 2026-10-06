import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireViewer, handle, ApiError } from "@/lib/api";
import { getSettlementPlan, getPairwiseBalance, findNonMembers } from "@/lib/queries";
import { getCachedPlan, setCachedPlan, invalidatePlan } from "@/lib/cache";
import { settleSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { canSettle, redactTransfers } from "@/lib/visibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The minimal settlement plan ("A pays B $X").
export async function GET() {
  return handle(async () => {
    const { householdId, viewer } = await requireViewer();

    const cached = await getCachedPlan(householdId);
    if (cached) {
      return NextResponse.json({
        ...cached,
        transfers: redactTransfers(cached.transfers, viewer),
        balances: viewer.isAdmin ? cached.balances : [],
        cached: true,
      });
    }

    const plan = await getSettlementPlan(householdId);
    void setCachedPlan(householdId, plan);
    // The plan itself is public ("A pays B"); the figures are not.
    return NextResponse.json({
      ...plan,
      transfers: redactTransfers(plan.transfers, viewer),
      balances: viewer.isAdmin ? plan.balances : [],
    });
  });
}

// Record that a transfer was paid; this rebalances the ledger.
export async function POST(req: Request) {
  return handle(async () => {
    const { userId, householdId, viewer } = await requireViewer();
    const body = await req.json();
    const parsed = settleSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors[0]?.message ?? "Invalid settlement");
    }

    const { from, to, amount } = parsed.data;
    if (from === to) throw new ApiError(400, "Payer and payee must differ");
    // Only the two people involved (or the admin) may record a payment —
    // otherwise the "more than they owe" check below would let anyone probe
    // for a balance they aren't allowed to see.
    if (!canSettle({ from, to }, viewer)) {
      throw new ApiError(403, "Only the people involved can record this payment");
    }
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
      "Recorded a payment",
      amount,
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  });
}
