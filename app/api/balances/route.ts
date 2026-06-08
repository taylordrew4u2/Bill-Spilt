import { NextResponse } from "next/server";
import { requireHousehold, handle } from "@/lib/api";
import { getBalances, getMembers } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const { householdId } = await requireHousehold();
    const [balances, members] = await Promise.all([
      getBalances(householdId),
      getMembers(householdId),
    ]);
    return NextResponse.json({ balances, members });
  });
}
