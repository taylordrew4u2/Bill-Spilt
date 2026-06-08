import { NextResponse } from "next/server";
import { requireHousehold, handle } from "@/lib/api";
import { getSettlements } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Recorded settlement history ("X paid Y $Z").
export async function GET() {
  return handle(async () => {
    const { householdId } = await requireHousehold();
    const settlements = await getSettlements(householdId);
    return NextResponse.json({ settlements });
  });
}
