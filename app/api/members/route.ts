import { NextResponse } from "next/server";
import { requireHousehold, handle } from "@/lib/api";
import { getMembers } from "@/lib/queries";
import { getUserHousehold } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const { userId, householdId } = await requireHousehold();
    const [members, household] = await Promise.all([
      getMembers(householdId),
      getUserHousehold(userId),
    ]);
    return NextResponse.json({ members, household, currentUserId: userId });
  });
}
