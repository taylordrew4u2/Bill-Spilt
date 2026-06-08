import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireHousehold, handle, ApiError } from "@/lib/api";
import { getSettlementPlan, isMember } from "@/lib/queries";
import { getCachedPlan, setCachedPlan, invalidatePlan } from "@/lib/cache";
import { settleSchema } from "@/lib/validation";

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
    const { householdId } = await requireHousehold();
    const body = await req.json();
    const parsed = settleSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Invalid settlement");

    const { from, to, amount } = parsed.data;
    if (from === to) throw new ApiError(400, "Payer and payee must differ");
    if (!(await isMember(householdId, from)) || !(await isMember(householdId, to))) {
      throw new ApiError(403, "Both parties must be household members");
    }

    await sql`
      INSERT INTO settlements (household_id, from_user, to_user, amount)
      VALUES (${householdId}, ${from}, ${to}, ${amount})
    `;
    void invalidatePlan(householdId);
    return NextResponse.json({ ok: true }, { status: 201 });
  });
}
